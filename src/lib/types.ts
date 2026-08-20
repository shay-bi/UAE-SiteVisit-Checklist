export type FailureStage = "before" | "during" | "end";

export type ChecklistItem = {
  id: string;
  label: string;
};

export type ChecklistGroup = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type SubmitPayload = {
  employeeName: string;
  stage: FailureStage;
  checkedItemIds: string[];
  itemNotes: Record<string, string>;
  notes: string;
  siteLocation?: string;
};
