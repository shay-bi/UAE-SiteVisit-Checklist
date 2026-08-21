export type ChecklistItem = {
  id: string;
  label: string;
  /** Optional action button shown next to the item (e.g. Flight Report). */
  action?: {
    href: string;
    label: string;
  };
};

export type ChecklistGroup = {
  id: string;
  title: string;
  items: ChecklistItem[];
  /** If true, items are only needed when relevant (e.g. flights). */
  optional?: boolean;
  /** Visual style — danger for flight / high-risk sections. */
  variant?: "default" | "danger";
};

export type SubmitPayload = {
  employeeName: string;
  employeeEmail: string;
  siteLocation: string;
  checkedItemIds: string[];
  notes: string;
};
