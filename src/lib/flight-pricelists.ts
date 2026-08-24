/** Flight pricelist options from the Flights Pricelist document. */
export const FLIGHT_PRICELISTS = [
  "Bench (NEW)",
  "Bench disassemble/assemble",
  "Main link (LTE / RF) (NEW) & assemble/disassemble",
  "Main board (NEW)",
  "Main board assemble/disassemble",
  "Dock (battery) replacement & assemble/disassemble",
  "Dock (payload) replacement & assemble/disassemble",
  "Micro-coax (payload) replacement",
  "Motor (NEW)",
  "Motor assemble/disassemble",
  "Props replacement (NEW)",
  "Props assemble/disassemble",
  "ESC assemble/disassemble",
  "ESC replacement (NEW)",
  "Winch replacement",
  "Winch assemble/disassemble",
  "Compass replacement & assemble/disassemble",
  "GPS Antenna replacement & assemble/disassemble",
  "GPS Novatel Unit replacement & assemble/disassemble",
  "Micro-Pilot replacement (NEW)",
  "Short Cycle",
  "Long Cycle",
  "Fire Tower",
  "Arm pits replacement",
  "Door replacement",
  "Door assemble/disassemble",
  "Winch funnel replacement",
  "HUB PCB Plug Replacement",
  "Canister replacement",
  "Canister assemble/disassemble",
] as const;

export type FlightPricelist = (typeof FLIGHT_PRICELISTS)[number];

export function isValidFlightPricelist(value: string): value is FlightPricelist {
  return (FLIGHT_PRICELISTS as readonly string[]).includes(value.trim());
}

export function filterFlightPricelists(query: string): FlightPricelist[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...FLIGHT_PRICELISTS];
  return FLIGHT_PRICELISTS.filter((item) => item.toLowerCase().includes(q));
}
