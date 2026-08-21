export type FormDraft = {
  siteLocation: string;
  checked: Record<string, boolean>;
  notes: string;
};

const DRAFT_PREFIX = "airobotics-site-visit-draft:";

function draftKey(email: string): string {
  return `${DRAFT_PREFIX}${email.trim().toLowerCase()}`;
}

export function loadFormDraft(email: string): FormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormDraft>;
    return {
      siteLocation:
        typeof parsed.siteLocation === "string" ? parsed.siteLocation : "",
      checked:
        parsed.checked && typeof parsed.checked === "object"
          ? (parsed.checked as Record<string, boolean>)
          : {},
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return null;
  }
}

export function saveFormDraft(email: string, draft: FormDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(draftKey(email), JSON.stringify(draft));
}

export function clearFormDraft(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(email));
}
