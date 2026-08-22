import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isWorkEmail } from "@/lib/auth";
import {
  findItemLabel,
  requiredChecklistItemIds,
} from "@/lib/checklist";
import { saveReport } from "@/lib/reports-store";
import { isValidStation } from "@/lib/stations";
import {
  checkSubmitRateLimit,
  formatRateLimitMessage,
  recordSubmitRateLimit,
} from "@/lib/submit-rate-limit";
import { buildSubmissionEmail } from "@/lib/submission-email";
import type { SubmitPayload } from "@/lib/types";

function isValidPayload(body: unknown): body is SubmitPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.employeeName !== "string" || !b.employeeName.trim()) return false;
  if (typeof b.employeeEmail !== "string" || !isWorkEmail(b.employeeEmail))
    return false;
  if (typeof b.siteLocation !== "string" || !isValidStation(b.siteLocation))
    return false;
  if (typeof b.notes !== "string") return false;
  if (!Array.isArray(b.checkedItemIds)) return false;
  if (!b.checkedItemIds.every((id) => typeof id === "string")) return false;

  const checkedIds = b.checkedItemIds as string[];
  const checked = new Set(checkedIds);
  const requiredIds = requiredChecklistItemIds(checkedIds);
  if (requiredIds.length === 0 || requiredIds.some((id) => !checked.has(id))) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email is not configured (missing RESEND_API_KEY)." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      {
        error:
          "Please complete all required fields, including every safety item, using a @airoboticsdrones.com email.",
      },
      { status: 400 },
    );
  }

  const employeeName = body.employeeName.trim();
  const employeeEmail = body.employeeEmail.trim().toLowerCase();
  const siteLocation = body.siteLocation.trim();
  const notes = body.notes.trim();

  const rateLimit = await checkSubmitRateLimit(employeeEmail);
  if (rateLimit.limited && rateLimit.retryAfterSeconds) {
    return NextResponse.json(
      {
        error: formatRateLimitMessage(rateLimit.retryAfterSeconds),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const submittedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    dateStyle: "full",
    timeStyle: "short",
  });

  const checkedItemIds = body.checkedItemIds;

  const { subject, text, html } = buildSubmissionEmail({
    employeeName,
    employeeEmail,
    siteLocation,
    checkedItemIds,
    notes,
    submittedAt,
  });

  const toEmail =
    process.env.REPORT_TO_EMAIL ?? "shaybit@airoboticsdrones.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    "Airobotics Checklist <onboarding@resend.dev>";

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [toEmail],
      replyTo: employeeEmail,
      subject,
      text,
      html,
    },
    { idempotencyKey: `site-visit/${employeeEmail}/${Date.now()}` },
  );

  if (error) {
    console.error("Resend error:", error.message);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 502 },
    );
  }

  recordSubmitRateLimit(employeeEmail);
  await saveReport({
    id: randomUUID(),
    employeeName,
    employeeEmail,
    siteLocation,
    checkedItemIds,
    checkedLabels: checkedItemIds.map((id) => findItemLabel(id)),
    notes,
    submittedAtIso: new Date().toISOString(),
    submittedAtUae: submittedAt,
  });

  return NextResponse.json({ ok: true, id: data?.id });
}
