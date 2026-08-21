import type { ChecklistGroup } from "./types";

/**
 * Site visit safety checklist.
 * Optional groups (e.g. Flight) are only filled when relevant.
 */
export const SAFETY_CHECKLIST: ChecklistGroup[] = [
  {
    id: "readiness",
    title: "Readiness",
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
        label: "Client informed: maintenance started, expected duration, and procedure",
      },
      {
        id: "in-site-2",
        label: "Investigators informed and updated during the work",
      },
    ],
  },
  {
    id: "flight",
    title: "Flight (if required)",
    optional: true,
    variant: "danger",
    items: [
      {
        id: "flight-1",
        label: 'Read the "Flight Report" before any flight',
      },
      {
        id: "flight-2",
        label: "Got investigator approval to start the flight",
      },
    ],
  },
  {
    id: "closeout",
    title: "Close-out",
    items: [
      { id: "close-1", label: "Station in RedCon and ready for operation" },
      { id: "close-2", label: "All work tools returned" },
      { id: "close-3", label: "Investigators informed" },
      { id: "close-4", label: "Station returned to the client" },
    ],
  },
];

export function findItemLabel(itemId: string): string {
  for (const group of SAFETY_CHECKLIST) {
    const item = group.items.find((i) => i.id === itemId);
    if (item) return item.label;
  }
  return itemId;
}

/** Required checklist item ids (skips optional groups like Flight). */
export function requiredChecklistItemIds(): string[] {
  return SAFETY_CHECKLIST.filter((group) => !group.optional).flatMap((group) =>
    group.items.map((item) => item.id),
  );
}

/** @deprecated use requiredChecklistItemIds */
export function allChecklistItemIds(): string[] {
  return requiredChecklistItemIds();
}
