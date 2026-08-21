import type { ChecklistGroup } from "./types";

/**
 * Site visit safety checklist.
 * Optional groups (e.g. Flight): if the first item is checked, the rest of
 * that group becomes mandatory for submit.
 */
export const SAFETY_CHECKLIST: ChecklistGroup[] = [
  {
    id: "readiness",
    title: "Before site",
    items: [
      {
        id: "readiness-1",
        label:
          "Client and investigators informed; all needed equipment is available",
      },
    ],
  },
  {
    id: "in-site",
    title: "In site",
    items: [
      {
        id: "in-site-1",
        label:
          "Client informed that: maintenance started, expected duration, and procedure",
      },
      {
        id: "in-site-2",
        label: "Investigators informed and updated during the work",
      },
    ],
  },
  {
    id: "flight",
    title: "Flight (if needed)",
    optional: true,
    variant: "danger",
    items: [
      {
        id: "flight-1",
        label: "Read the Flight Report before any flight",
        inlineLink: {
          href: "/flight-report",
          text: "Flight Report",
        },
      },
      {
        id: "flight-2",
        label: "Check the GPS App",
      },
      {
        id: "flight-3",
        label: "Work with the Flights Pricelist",
        inlineLink: {
          href: "/flights-pricelist",
          text: "Flights Pricelist",
        },
      },
      {
        id: "flight-4",
        label: "Got investigator approval to start the flight",
      },
    ],
  },
  {
    id: "closeout",
    title: "Close-out",
    items: [
      {
        id: "close-1",
        label: "",
        bullets: [
          "Station in RedCon and ready for operation",
          "Synchronized Takeoff and Supervisor fields are restored",
          "All work tools returned",
          "Investigators informed; station returned to the client",
        ],
      },
    ],
  },
];

export function findItemLabel(itemId: string): string {
  for (const group of SAFETY_CHECKLIST) {
    const item = group.items.find((i) => i.id === itemId);
    if (!item) continue;
    if (item.bullets?.length) {
      return item.bullets.map((b) => `- ${b}`).join(" ");
    }
    return item.label;
  }
  return itemId;
}

type CheckedLookup =
  | Record<string, boolean>
  | Set<string>
  | readonly string[];

function isItemChecked(checked: CheckedLookup | undefined, id: string): boolean {
  if (!checked) return false;
  if (Array.isArray(checked)) return checked.includes(id);
  if (checked instanceof Set) return checked.has(id);
  return Boolean((checked as Record<string, boolean>)[id]);
}

/**
 * Required checklist item ids.
 * Optional groups (e.g. Flight) stay optional unless the first item in that
 * group is checked — then every item in the group is required.
 */
export function requiredChecklistItemIds(
  checked?: CheckedLookup,
): string[] {
  const ids: string[] = [];

  for (const group of SAFETY_CHECKLIST) {
    if (!group.optional) {
      ids.push(...group.items.map((item) => item.id));
      continue;
    }

    const gateId = group.items[0]?.id;
    if (gateId && isItemChecked(checked, gateId)) {
      ids.push(...group.items.map((item) => item.id));
    }
  }

  return ids;
}

/** @deprecated use requiredChecklistItemIds */
export function allChecklistItemIds(
  checked?: CheckedLookup,
): string[] {
  return requiredChecklistItemIds(checked);
}
