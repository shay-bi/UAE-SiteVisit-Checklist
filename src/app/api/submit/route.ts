import { NextResponse } from "next/server";
import { Resend } from "resend";
import { STAGE_LABELS, findItemLabel } from "@/lib/checklist";
import type { FailureStage, SubmitPayload } from "@/lib/types";

const STAGES: FailureStage[] = ["before", "during", "end"];

function isValidPayload(body: unknown): body is SubmitPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.employeeName !== "string" || !b.employeeName.trim()) return false;
  if (typeof b.stage !== "string" || !STAGES.includes(b.stage as FailureStage))
    return false;
  if (!Array.isArray(b.checkedItemIds)) return false;
  if (!b.checkedItemIds.every((id) => typeof id === "string")) return false;
  if (typeof b.notes !== "string") return false;
  if (b.itemNotes !== undefined && typeof b.itemNotes !== "object") return false;
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
      { error: "Please fill in employee name and select a stage." },
      { status: 400 },
    );
  }

  const employeeName = body.employeeName.trim();
  const stage = body.stage;
  const stageLabel = STAGE_LABELS[stage];
  const siteLocation = body.siteLocation?.trim() || "Not provided";
  const notes = body.notes.trim() || "None";
  const itemNotes = body.itemNotes ?? {};
  const submittedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    dateStyle: "full",
    timeStyle: "short",
  });

  const checkedLines =
    body.checkedItemIds.length > 0
      ? body.checkedItemIds.map((id) => {
          const note = itemNotes[id]?.trim();
          return note
            ? `✓ ${findItemLabel(id)} — Note: ${note}`
            : `✓ ${findItemLabel(id)}`;
        })
      : ["(No checklist items selected)"];

  const toEmail =
    process.env.REPORT_TO_EMAIL ?? "shaybit@airoboticsdrones.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    "AI Robotics Checklist <onboarding@resend.dev>";

  const subject = `[Failure ${stageLabel}] ${employeeName} — ${siteLocation}`;

  const text = [
    "AI Robotics — Failure Safety Report",
    "",
    `Employee: ${employeeName}`,
    `Stage: ${stageLabel}`,
    `Site / location: ${siteLocation}`,
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
      <h1 style="font-size:18px;margin:0 0 12px">AI Robotics — Failure Safety Report</h1>
      <p style="margin:0 0 8px"><strong>Employee:</strong> ${escapeHtml(employeeName)}</p>
      <p style="margin:0 0 8px"><strong>Stage:</strong> ${escapeHtml(stageLabel)}</p>
      <p style="margin:0 0 8px"><strong>Site / location:</strong> ${escapeHtml(siteLocation)}</p>
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
      subject,
      text,
      html,
    },
    { idempotencyKey: `failure-report/${employeeName}/${stage}/${Date.now()}` },
  );

  if (error) {
    console.error("Resend error:", error.message);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
