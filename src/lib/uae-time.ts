const UAE_TZ = "Asia/Dubai";

/** ISO timestamp → short UAE clock time, e.g. "15:42". */
export function formatUaeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    timeZone: UAE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** ISO timestamp → UAE date + time, e.g. "23 Aug 2026, 15:42". */
export function formatUaeDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    timeZone: UAE_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value));
}
