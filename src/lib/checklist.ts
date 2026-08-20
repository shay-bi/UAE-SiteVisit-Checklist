import type { ChecklistGroup } from "./types";

/**
 * Placeholder Safety mechanisms — replace with your real checklist items.
 * Keep the same shape: groups → items with stable `id` values.
 */
export const SAFETY_CHECKLIST: ChecklistGroup[] = [
  {
    id: "ppe",
    title: "PPE & readiness (placeholder)",
    items: [
      { id: "ppe-1", label: "Required PPE available and worn" },
      { id: "ppe-2", label: "Tools and spare parts prepared" },
      { id: "ppe-3", label: "Site access / permits confirmed" },
    ],
  },
  {
    id: "site-safety",
    title: "Site safety (placeholder)",
    items: [
      { id: "site-1", label: "Work area secured / marked" },
      { id: "site-2", label: "Power / energy isolation verified" },
      { id: "site-3", label: "Bystanders kept clear" },
      { id: "site-4", label: "Following approved work procedure" },
    ],
  },
  {
    id: "closeout",
    title: "Close-out (placeholder)",
    items: [
      { id: "close-1", label: "Equipment restored to safe state" },
      { id: "close-2", label: "Area cleaned and hazards removed" },
      { id: "close-3", label: "Customer / ops briefed on outcome" },
      { id: "close-4", label: "Failure cause and follow-ups documented" },
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
