import { SAFETY_CHECKLIST, findItemLabel } from "@/lib/checklist";
import type { ChecklistGroup, ChecklistItem } from "@/lib/types";
import { formatUaeTime } from "@/lib/uae-time";

export type SubmissionEmailInput = {
  employeeName: string;
  employeeEmail: string;
  siteLocation: string;
  checkedItemIds: string[];
  checkedAtByItemId?: Record<string, string>;
  notes: string;
  flightPricelist?: string;
  submittedAt: string;
};

export type SubmissionEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemPlainLabel(item: ChecklistItem): string {
  if (item.bullets?.length) {
    return item.bullets.join("; ");
  }
  if (item.inlineLink && item.label.includes(item.inlineLink.text)) {
    return item.label;
  }
  return item.label || findItemLabel(item.id);
}

function groupHasCheckedItems(
  group: ChecklistGroup,
  checked: Set<string>,
): boolean {
  return group.items.some((item) => checked.has(item.id));
}

function timeBadge(iso: string | undefined): string {
  if (!iso) return "";
  const time = formatUaeTime(iso);
  return time ? ` · ${time}` : "";
}

function timeBadgeHtml(iso: string | undefined): string {
  if (!iso) return "";
  const time = formatUaeTime(iso);
  if (!time) return "";
  return `<span style="display:inline-block;margin-left:8px;padding:2px 7px;border-radius:999px;background:#e5e7eb;font-size:11px;font-weight:700;letter-spacing:0.02em;color:#4b5563;white-space:nowrap">${escapeHtml(time)}</span>`;
}

function renderChecklistText(
  checked: Set<string>,
  checkedAtByItemId: Record<string, string>,
): string[] {
  const lines: string[] = [];

  for (const group of SAFETY_CHECKLIST) {
    if (group.optional && !groupHasCheckedItems(group, checked)) {
      continue;
    }

    lines.push(`${group.title.toUpperCase()}`);
    for (const item of group.items) {
      if (!checked.has(item.id)) continue;
      const label = itemPlainLabel(item);
      const when = timeBadge(checkedAtByItemId[item.id]);
      if (item.bullets?.length) {
        lines.push(`  [x] ${group.title}${when}`);
        for (const bullet of item.bullets) {
          lines.push(`      - ${bullet}`);
        }
      } else {
        lines.push(`  [x] ${label}${when}`);
      }
    }
    lines.push("");
  }

  return lines;
}

function renderChecklistHtml(
  checked: Set<string>,
  checkedAtByItemId: Record<string, string>,
): string {
  const sections: string[] = [];

  for (const group of SAFETY_CHECKLIST) {
    if (group.optional && !groupHasCheckedItems(group, checked)) {
      continue;
    }

    const isFlight = group.variant === "danger";
    const sectionBorder = isFlight ? "#ef4444" : "#f05a28";
    const sectionBg = isFlight ? "#fef2f2" : "#fafafa";
    const titleColor = isFlight ? "#b91c1c" : "#f05a28";

    const rows: string[] = [];
    for (const item of group.items) {
      if (!checked.has(item.id)) continue;
      const whenHtml = timeBadgeHtml(checkedAtByItemId[item.id]);

      if (item.bullets?.length) {
        const bulletList = item.bullets
          .map(
            (bullet) => `
              <p style="margin:0 0 6px;padding:0;font-size:14px;line-height:1.5;color:#374151">
                <span style="color:#9ca3af;margin-right:8px">&#8226;</span>${escapeHtml(bullet)}
              </p>`,
          )
          .join("");

        rows.push(`
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:24px">
              <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:4px;background:#16a34a;color:#ffffff;font-size:12px;font-weight:700">&#10003;</span>
            </td>
            <td style="padding:10px 0;vertical-align:top">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827">
                Completed${whenHtml}
              </p>
              ${bulletList}
            </td>
          </tr>`);
      } else {
        rows.push(`
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:24px">
              <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:4px;background:#16a34a;color:#ffffff;font-size:12px;font-weight:700">&#10003;</span>
            </td>
            <td style="padding:8px 0;font-size:14px;line-height:1.45;color:#111827;vertical-align:top">
              ${escapeHtml(itemPlainLabel(item))}${whenHtml}
            </td>
          </tr>`);
      }
    }

    if (rows.length === 0) continue;

    sections.push(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;border-collapse:separate;border:1px solid ${sectionBorder};border-radius:8px;background:${sectionBg};overflow:hidden">
        <tr>
          <td style="padding:10px 14px;background:${isFlight ? "#fee2e2" : "#fff7f3"};border-bottom:1px solid ${sectionBorder}">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${titleColor}">
              ${escapeHtml(group.title)}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 14px 12px">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
              ${rows.join("")}
            </table>
          </td>
        </tr>
      </table>`);
  }

  return sections.join("");
}

export function buildSubmissionEmail(
  input: SubmissionEmailInput,
): SubmissionEmailContent {
  const {
    employeeName,
    employeeEmail,
    siteLocation,
    checkedItemIds,
    checkedAtByItemId = {},
    notes,
    flightPricelist = "",
    submittedAt,
  } = input;

  const checked = new Set(checkedItemIds);
  const flightIncluded = groupHasCheckedItems(
    SAFETY_CHECKLIST.find((g) => g.id === "flight")!,
    checked,
  );

  const subject = `[Site Visit] Station ${siteLocation} · ${employeeName}${flightIncluded ? " · FLIGHT" : ""}`;

  const text = [
    "SITE VISIT CHECKLIST",
    "====================",
    "",
    `Station:     ${siteLocation}`,
    `Employee:    ${employeeName}`,
    `Email:       ${employeeEmail}`,
    `Submitted:   ${submittedAt} (UAE)`,
    flightIncluded ? "Flight:      Yes" : "",
    flightPricelist ? `Pricelist:   ${flightPricelist}` : "",
    "",
    "CHECKLIST (times in UAE)",
    "------------------------",
    ...renderChecklistText(checked, checkedAtByItemId),
    "NOTES",
    "-----",
    notes.trim() || "(none)",
    "",
    "— Reply to reach the employee who submitted this report.",
  ]
    .filter(Boolean)
    .join("\n");

  const notesBlock = notes.trim()
    ? `<p style="margin:0;font-size:14px;line-height:1.55;color:#111827;white-space:pre-wrap">${escapeHtml(notes)}</p>`
    : `<p style="margin:0;font-size:14px;line-height:1.55;color:#6b7280;font-style:italic">No additional notes.</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mandatory Site Visit Checklist — Station ${escapeHtml(siteLocation)}</title>
</head>
<body style="margin:0;padding:0;background:#ececef;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ececef;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;border-collapse:collapse">
          <!-- Header -->
          <tr>
            <td style="background:#121214;border-radius:12px 12px 0 0;padding:20px 24px;border-bottom:4px solid #f05a28">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f05a28">
                Airobotics Dubai
              </p>
              <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:#ffffff">
                Mandatory Site Visit Checklist
              </h1>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="background:#ffffff;padding:20px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
                <tr>
                  <td style="padding:0 0 16px">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;background:#fff7f3;border:1px solid #fed7aa;border-radius:10px">
                      <tr>
                        <td style="padding:16px 18px">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2410c">
                            Station
                          </p>
                          <p style="margin:0;font-size:32px;line-height:1;font-weight:700;color:#111827">
                            ${escapeHtml(siteLocation)}
                          </p>
                        </td>
                        ${
                          flightIncluded
                            ? `<td align="right" style="padding:16px 18px;vertical-align:top">
                          <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#fee2e2;border:1px solid #ef4444;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#b91c1c">
                            Flight
                          </span>
                        </td>`
                            : ""
                        }
                      </tr>
                      ${
                        flightPricelist
                          ? `<tr>
                        <td colspan="2" style="padding:0 18px 16px">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2410c">
                            Flight pricelist
                          </p>
                          <p style="margin:0;font-size:15px;line-height:1.45;font-weight:600;color:#111827">
                            ${escapeHtml(flightPricelist)}
                          </p>
                        </td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
                      <tr>
                        <td width="50%" style="padding:0 8px 12px 0;vertical-align:top">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">Employee</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#111827">${escapeHtml(employeeName)}</p>
                        </td>
                        <td width="50%" style="padding:0 0 12px 8px;vertical-align:top">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">Submitted (UAE)</p>
                          <p style="margin:0;font-size:14px;line-height:1.4;color:#111827">${escapeHtml(submittedAt)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:0 0 4px">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">Email</p>
                          <p style="margin:0;font-size:14px;color:#111827">
                            <a href="mailto:${escapeHtml(employeeEmail)}" style="color:#f05a28;text-decoration:none;font-weight:600">${escapeHtml(employeeEmail)}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Checklist -->
          <tr>
            <td style="background:#ffffff;padding:4px 24px 8px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
              <h2 style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280">
                Safety checklist
              </h2>
              ${renderChecklistHtml(checked, checkedAtByItemId)}
            </td>
          </tr>

          <!-- Notes -->
          <tr>
            <td style="background:#ffffff;padding:8px 24px 20px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
              <h2 style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280">
                Additional notes
              </h2>
              <div style="padding:14px 16px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb">
                ${notesBlock}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:14px 24px">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280">
                Reply to this email to contact <strong style="color:#374151">${escapeHtml(employeeName)}</strong> directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
