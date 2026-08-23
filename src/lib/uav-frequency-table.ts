export type UavFrequencyRow = {
  key: string;
  id: string;
  uav: string;
  frequency: string;
  location: string;
};

export type FrequencyBand = "433.1" | "433.9" | "434.75" | "other";

export type UavFrequencyProposalStatus = "pending" | "approved" | "rejected";

export type UavFrequencyProposal = {
  id: string;
  status: UavFrequencyProposalStatus;
  rows: UavFrequencyRow[];
  proposedByName: string;
  proposedByEmail: string;
  createdAtIso: string;
  reviewedAtIso?: string;
  reviewedByEmail?: string;
};

export const DEFAULT_UAV_FREQUENCY_ROWS: UavFrequencyRow[] = [
  { key: "r1", id: "1", uav: "NONE", frequency: "433.1", location: "FACILITY" },
  { key: "r2", id: "2", uav: "322, 423", frequency: "433.1", location: "204, 209" },
  { key: "r3", id: "3", uav: "412", frequency: "433.1", location: "FACILITY" },
  { key: "r4", id: "4", uav: "414", frequency: "433.1", location: "216" },
  { key: "r5", id: "5", uav: "NONE", frequency: "433.1", location: "" },
  { key: "r6", id: "6", uav: "421", frequency: "433.9", location: "208" },
  { key: "r7", id: "7", uav: "398", frequency: "433.9", location: "FACILITY" },
  { key: "r8", id: "8", uav: "391", frequency: "433.9", location: "FACILITY" },
  { key: "r9", id: "9", uav: "409", frequency: "433.9", location: "FACILITY" },
  { key: "r10", id: "0", uav: "NONE", frequency: "433.9", location: "" },
  { key: "r11", id: "A", uav: "418", frequency: "434.75", location: "212" },
  { key: "r12", id: "B", uav: "399, 415", frequency: "434.75", location: "FACILITY, 205" },
  { key: "r13", id: "C", uav: "416, 422", frequency: "434.75", location: "FACILITY" },
  { key: "r14", id: "D", uav: "396", frequency: "434.75", location: "FACILITY" },
  { key: "r15", id: "E", uav: "402", frequency: "434.75", location: "208" },
  { key: "r16", id: "F", uav: "395, 417", frequency: "434.75", location: "212" },
  { key: "r17", id: "-", uav: "369", frequency: "-", location: "FACILITY" },
];

export function frequencyBand(frequency: string): FrequencyBand {
  const normalized = frequency.trim();
  if (normalized === "433.1") return "433.1";
  if (normalized === "433.9") return "433.9";
  if (normalized === "434.75") return "434.75";
  return "other";
}

/** Soft, readable band colors for mobile. */
export function bandRowClass(band: FrequencyBand): string {
  switch (band) {
    case "433.1":
      return "bg-emerald-100/90 text-emerald-950";
    case "433.9":
      return "bg-amber-100/90 text-amber-950";
    case "434.75":
      return "bg-slate-200/90 text-slate-900";
    default:
      return "bg-white text-slate-900";
  }
}

function isValidRow(value: unknown): value is UavFrequencyRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.key === "string" &&
    typeof row.id === "string" &&
    typeof row.uav === "string" &&
    typeof row.frequency === "string" &&
    typeof row.location === "string"
  );
}

export function isValidUavFrequencyRows(
  value: unknown,
): value is UavFrequencyRow[] {
  return Array.isArray(value) && value.every(isValidRow);
}

export function createEmptyRow(): UavFrequencyRow {
  return {
    key: `row-${crypto.randomUUID()}`,
    id: "",
    uav: "",
    frequency: "",
    location: "",
  };
}

export function rowsEqual(
  a: UavFrequencyRow[],
  b: UavFrequencyRow[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (row, i) =>
      row.key === b[i]?.key &&
      row.id === b[i]?.id &&
      row.uav === b[i]?.uav &&
      row.frequency === b[i]?.frequency &&
      row.location === b[i]?.location,
  );
}

export function summarizeRowDiff(
  published: UavFrequencyRow[],
  proposed: UavFrequencyRow[],
): string[] {
  const changes: string[] = [];
  const publishedByKey = new Map(published.map((r) => [r.key, r]));
  const proposedKeys = new Set(proposed.map((r) => r.key));

  for (const row of proposed) {
    const prev = publishedByKey.get(row.key);
    if (!prev) {
      changes.push(`Added row ${row.id || "(blank)"}: UAV ${row.uav || "—"}, ${row.frequency || "—"}, ${row.location || "—"}`);
      continue;
    }
    const parts: string[] = [];
    if (prev.id !== row.id) parts.push(`ID ${prev.id || "—"} → ${row.id || "—"}`);
    if (prev.uav !== row.uav) parts.push(`UAV ${prev.uav || "—"} → ${row.uav || "—"}`);
    if (prev.frequency !== row.frequency)
      parts.push(`Freq ${prev.frequency || "—"} → ${row.frequency || "—"}`);
    if (prev.location !== row.location)
      parts.push(`Loc ${prev.location || "—"} → ${row.location || "—"}`);
    if (parts.length) {
      changes.push(`Updated ${row.id || row.key}: ${parts.join("; ")}`);
    }
  }

  for (const row of published) {
    if (!proposedKeys.has(row.key)) {
      changes.push(`Removed row ${row.id || row.key}`);
    }
  }

  return changes;
}
