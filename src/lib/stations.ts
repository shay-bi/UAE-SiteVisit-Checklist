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

/** Facility (formerly HOME) plus all station numbers. */
export const FACILITY_LOCATION = "FACILITY";

export const LOCATION_OPTIONS = [FACILITY_LOCATION, ...STATIONS] as const;

export type LocationOption = (typeof LOCATION_OPTIONS)[number];

export function isValidStation(value: string): value is StationId {
  return (STATIONS as readonly string[]).includes(value.trim());
}

export function isValidLocationOption(value: string): value is LocationOption {
  return (LOCATION_OPTIONS as readonly string[]).includes(value.trim());
}

/** Split a stored location string into option tokens (migrates HOME → FACILITY). */
export function parseLocations(value: string): string[] {
  return value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      if (trimmed.toUpperCase() === "HOME") return FACILITY_LOCATION;
      return trimmed;
    })
    .filter(Boolean);
}

export function formatLocations(values: string[]): string {
  const unique = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  return unique.join(", ");
}

export function migrateHomeToFacility(value: string): string {
  return formatLocations(parseLocations(value));
}
