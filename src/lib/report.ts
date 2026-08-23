export type StoredReport = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  siteLocation: string;
  checkedItemIds: string[];
  checkedLabels: string[];
  /** ISO timestamps for when each checked item was marked. */
  checkedAtByItemId?: Record<string, string>;
  notes: string;
  flightPricelist?: string;
  submittedAtIso: string;
  submittedAtUae: string;
};
