export type UavFrequencyRow = {
  key: string;
  id: string;
  uav: string;
  frequency: string;
  location: string;
};

export type FrequencyBand = "433.1" | "433.9" | "434.75" | "other";

const STORAGE_KEY = "airobotics-uav-frequency-table";

export const DEFAULT_UAV_FREQUENCY_ROWS: UavFrequencyRow[] = [
  { key: "r1", id: "1", uav: "NONE", frequency: "433.1", location: "HOME" },
  { key: "r2", id: "2", uav: "322, 423", frequency: "433.1", location: "204, 209" },
  { key: "r3", id: "3", uav: "412", frequency: "433.1", location: "HOME" },
  { key: "r4", id: "4", uav: "414", frequency: "433.1", location: "216" },
  { key: "r5", id: "5", uav: "NONE", frequency: "433.1", location: "" },
  { key: "r6", id: "6", uav: "421", frequency: "433.9", location: "208" },
  { key: "r7", id: "7", uav: "398", frequency: "433.9", location: "HOME" },
  { key: "r8", id: "8", uav: "391", frequency: "433.9", location: "HOME" },
  { key: "r9", id: "9", uav: "409", frequency: "433.9", location: "HOME" },
  { key: "r10", id: "0", uav: "NONE", frequency: "433.9", location: "" },
  { key: "r11", id: "A", uav: "418", frequency: "434.75", location: "212" },
  { key: "r12", id: "B", uav: "399, 415", frequency: "434.75", location: "HOME, 205" },
  { key: "r13", id: "C", uav: "416, 422", frequency: "434.75", location: "HOME" },
  { key: "r14", id: "D", uav: "396", frequency: "434.75", location: "HOME" },
  { key: "r15", id: "E", uav: "402", frequency: "434.75", location: "208" },
  { key: "r16", id: "F", uav: "395, 417", frequency: "434.75", location: "212" },
  { key: "r17", id: "-", uav: "369", frequency: "-", location: "HOME" },
];

export function frequencyBand(frequency: string): FrequencyBand {
  const normalized = frequency.trim();
  if (normalized === "433.1") return "433.1";
  if (normalized === "433.9") return "433.9";
  if (normalized === "434.75") return "434.75";
  return "other";
}

export function bandRowClass(band: FrequencyBand): string {
  switch (band) {
    case "433.1":
      return "bg-[#d9ead3] text-[#1a1a1a]";
    case "433.9":
      return "bg-[#fff2cc] text-[#1a1a1a]";
    case "434.75":
      return "bg-[#efefef] text-[#1a1a1a]";
    default:
      return "bg-white text-[#1a1a1a]";
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

export function loadUavFrequencyRows(): UavFrequencyRow[] {
  if (typeof window === "undefined") return [...DEFAULT_UAV_FREQUENCY_ROWS];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_UAV_FREQUENCY_ROWS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isValidRow)) {
      return [...DEFAULT_UAV_FREQUENCY_ROWS];
    }
    return parsed;
  } catch {
    return [...DEFAULT_UAV_FREQUENCY_ROWS];
  }
}

export function saveUavFrequencyRows(rows: UavFrequencyRow[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore quota / private mode failures.
  }
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
