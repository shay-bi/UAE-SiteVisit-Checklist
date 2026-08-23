import { Resend } from "resend";
import type { UavFrequencyProposal } from "@/lib/uav-frequency-table";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendProposalNotificationEmail(input: {
  proposal: UavFrequencyProposal;
  changes: string[];
  reviewUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing — skipped proposal email.");
    return;
  }

  const toEmail =
    process.env.REPORT_TO_EMAIL ?? "shaybit@airoboticsdrones.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ??
    "Airobotics Checklist <onboarding@resend.dev>";

  const { proposal, changes, reviewUrl } = input;
  const changeLines =
    changes.length > 0 ? changes : ["Full table replacement proposed."];

  const subject = `[UAVs Lora IDs] Approval needed — ${proposal.proposedByName}`;

  const text = [
    "A change to UAVs Lora IDs was submitted for your approval.",
    "",
    `From: ${proposal.proposedByName} <${proposal.proposedByEmail}>`,
    `When: ${proposal.createdAtIso}`,
    "",
    "Changes:",
    ...changeLines.map((line) => `- ${line}`),
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a1a1a">
      <h1 style="font-size:18px;margin:0 0 12px">UAVs Lora IDs — approval needed</h1>
      <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(proposal.proposedByName)} &lt;${escapeHtml(proposal.proposedByEmail)}&gt;</p>
      <h2 style="font-size:14px;margin:16px 0 8px">Proposed changes</h2>
      <ul style="margin:0 0 16px;padding-left:20px">
        ${changeLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
      <p style="margin:0"><a href="${escapeHtml(reviewUrl)}" style="color:#f05a28;font-weight:600">Open table to approve or reject</a></p>
    </div>
  `;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: proposal.proposedByEmail,
    subject,
    text,
    html,
  });

  if (error) {
    console.error("Proposal notification email failed:", error.message);
  }
}
