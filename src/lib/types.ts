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
  employeeEmail: string;
  siteLocation: string;
  checkedItemIds: string[];
  notes: string;
};
