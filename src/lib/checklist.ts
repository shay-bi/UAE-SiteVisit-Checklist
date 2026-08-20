import type { ChecklistGroup, FailureStage } from "./types";

export const STAGE_LABELS: Record<FailureStage, string> = {
  before: "Before failure visit",
  during: "During failure",
  end: "End of failure",
};

/**
 * Placeholder Safety mechanisms — replace with your real checklist items.
 * Keep the same shape: groups → items with stable `id` values.
 */
export const SAFETY_CHECKLIST: Record<FailureStage, ChecklistGroup[]> = {
  before: [
    {
      id: "before-ppe",
      title: "PPE & readiness (placeholder)",
      items: [
        { id: "before-ppe-1", label: "Required PPE available and worn" },
        { id: "before-ppe-2", label: "Tools and spare parts prepared" },
        { id: "before-ppe-3", label: "Site access / permits confirmed" },
      ],
    },
    {
      id: "before-comms",
      title: "Communication (placeholder)",
      items: [
        { id: "before-comms-1", label: "Team notified of departure" },
        { id: "before-comms-2", label: "Emergency contacts known" },
      ],
    },
  ],
  during: [
    {
      id: "during-lockout",
      title: "Site safety (placeholder)",
      items: [
        { id: "during-lockout-1", label: "Work area secured / marked" },
        { id: "during-lockout-2", label: "Power / energy isolation verified" },
        { id: "during-lockout-3", label: "Bystanders kept clear" },
      ],
    },
    {
      id: "during-ops",
      title: "Work in progress (placeholder)",
      items: [
        { id: "during-ops-1", label: "Following approved work procedure" },
        { id: "during-ops-2", label: "Status reported to operations" },
      ],
    },
  ],
  end: [
    {
      id: "end-restore",
      title: "Close-out (placeholder)",
      items: [
        { id: "end-restore-1", label: "Equipment restored to safe state" },
        { id: "end-restore-2", label: "Area cleaned and hazards removed" },
        { id: "end-restore-3", label: "Customer / ops briefed on outcome" },
      ],
    },
    {
      id: "end-report",
      title: "Handover (placeholder)",
      items: [
        { id: "end-report-1", label: "Failure cause documented" },
        { id: "end-report-2", label: "Follow-up actions noted" },
      ],
    },
  ],
};

export function findItemLabel(itemId: string): string {
  for (const groups of Object.values(SAFETY_CHECKLIST)) {
    for (const group of groups) {
      const item = group.items.find((i) => i.id === itemId);
      if (item) return item.label;
    }
  }
  return itemId;
}
