/** Allowed site station numbers for checklist submissions. */
export const STATIONS = [
  "204",
  "205",
  "208",
  "209",
  "212",
  "213",
  "214",
  "216",
  "222",
  "224",
  "225",
  "227",
] as const;

export type StationId = (typeof STATIONS)[number];

export function isValidStation(value: string): value is StationId {
  return (STATIONS as readonly string[]).includes(value.trim());
}
