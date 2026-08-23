export type StoredReport = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  siteLocation: string;
  checkedItemIds: string[];
  checkedLabels: string[];
  notes: string;
  flightPricelist?: string;
  submittedAtIso: string;
  submittedAtUae: string;
};
