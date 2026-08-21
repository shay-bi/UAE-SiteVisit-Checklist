/**
 * Checklist form draft — survives navigation to any other page
 * (Flight Report, Admin, future routes) via localStorage.
 */
export type FormDraft = {
  siteLocation: string;
  checked: Record<string, boolean>;
  notes: string;
};

const DRAFT_PREFIX = "airobotics-site-visit-draft:";

function draftKey(email: string): string {
  return `${DRAFT_PREFIX}${email.trim().toLowerCase()}`;
}

export function emptyFormDraft(): FormDraft {
  return { siteLocation: "", checked: {}, notes: "" };
}

export function loadFormDraft(email: string): FormDraft {
  if (typeof window === "undefined") return emptyFormDraft();
  try {
    const raw = window.localStorage.getItem(draftKey(email));
    if (!raw) return emptyFormDraft();
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
    return emptyFormDraft();
  }
}

export function saveFormDraft(email: string, draft: FormDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftKey(email), JSON.stringify(draft));
  } catch {
    // Ignore quota / private mode failures; form still works in-memory.
  }
}

export function clearFormDraft(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(email));
}
