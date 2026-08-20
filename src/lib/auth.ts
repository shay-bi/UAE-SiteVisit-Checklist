export type StoredUser = {
  name: string;
  email: string;
};

export const WORK_EMAIL_DOMAIN = "airoboticsdrones.com";

/** Shown in the UI for the Admin panel button (API still requires admin password). */
export const ADMIN_UI_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "shaybit@airoboticsdrones.com"
)
  .trim()
  .toLowerCase();

const STORAGE_KEY = "airobotics-site-visit-user";

export function isAdminUser(user: StoredUser): boolean {
  return user.email.trim().toLowerCase() === ADMIN_UI_EMAIL;
}

export function isWorkEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(`@${WORK_EMAIL_DOMAIN}`) &&
    normalized.length > WORK_EMAIL_DOMAIN.length + 1 &&
    !normalized.includes(" ")
  );
}

export function loadUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredUser>;
    if (
      typeof parsed.name !== "string" ||
      !parsed.name.trim() ||
      typeof parsed.email !== "string" ||
      !isWorkEmail(parsed.email)
    ) {
      return null;
    }
    return {
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function saveUser(user: StoredUser): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
    }),
  );
}

export function clearUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
