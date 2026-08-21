import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isWorkEmail } from "@/lib/auth";
import {
  findItemLabel,
  requiredChecklistItemIds,
} from "@/lib/checklist";
import { saveReport } from "@/lib/reports-store";
import type { SubmitPayload } from "@/lib/types";

function isValidPayload(body: unknown): body is SubmitPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.employeeName !== "string" || !b.employeeName.trim()) return false;
  if (typeof b.employeeEmail !== "string" || !isWorkEmail(b.employeeEmail))
    return false;
  if (typeof b.siteLocation !== "string" || !b.siteLocation.trim()) return false;
  if (typeof b.notes !== "string" || !b.notes.trim()) return false;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const submittedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    dateStyle: "full",
    timeStyle: "short",
  });

  const checkedLines = body.checkedItemIds.map(
    (id) => `✓ ${findItemLabel(id)}`,
  );

  const toEmail =
    process.env.REPORT_TO_EMAIL ?? "shaybit@airoboticsdrones.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    "Airobotics Checklist <onboarding@resend.dev>";

  const subject = `[Site Visit Checklist] ${employeeName} — ${siteLocation}`;

  const text = [
    "Airobotics — Site Visit Safety Report",
    "",
    `Employee: ${employeeName}`,
    `Email: ${employeeEmail}`,
    `Site + Failure: ${siteLocation}`,
    `Submitted (UAE): ${submittedAt}`,
    "",
    "Safety checklist:",
    ...checkedLines,
    "",
    "Additional notes:",
    notes,
  ].join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a1a1a">
      <h1 style="font-size:18px;margin:0 0 12px">Airobotics — Site Visit Safety Report</h1>
      <p style="margin:0 0 8px"><strong>Employee:</strong> ${escapeHtml(employeeName)}</p>
      <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(employeeEmail)}</p>
      <p style="margin:0 0 8px"><strong>Site + Failure:</strong> ${escapeHtml(siteLocation)}</p>
      <p style="margin:0 0 16px"><strong>Submitted (UAE):</strong> ${escapeHtml(submittedAt)}</p>
      <h2 style="font-size:15px;margin:0 0 8px">Safety checklist</h2>
      <ul style="margin:0 0 16px;padding-left:20px">
        ${checkedLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
      <h2 style="font-size:15px;margin:0 0 8px">Additional notes</h2>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(notes)}</p>
    </div>
  `;

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

  const checkedItemIds = body.checkedItemIds;
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
