import { listReports } from "@/lib/reports-store";

export const SUBMIT_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour per email

type GlobalRateLimit = {
  __submitLastByEmail?: Map<string, number>;
};

function lastSubmitMap(): Map<string, number> {
  const g = globalThis as GlobalRateLimit;
  if (!g.__submitLastByEmail) {
    g.__submitLastByEmail = new Map();
  }
  return g.__submitLastByEmail;
}

export type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds?: number;
};

function remainingMs(lastSubmitMs: number, now: number): number {
  return SUBMIT_RATE_LIMIT_MS - (now - lastSubmitMs);
}

/** Returns true if this email submitted within the last hour. */
export async function checkSubmitRateLimit(
  email: string,
): Promise<RateLimitResult> {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  const memLast = lastSubmitMap().get(normalized);
  if (memLast !== undefined) {
    const remaining = remainingMs(memLast, now);
    if (remaining > 0) {
      return {
        limited: true,
        retryAfterSeconds: Math.ceil(remaining / 1000),
      };
    }
  }

  const reports = await listReports();
  const latest = reports.find(
    (r) => r.employeeEmail.trim().toLowerCase() === normalized,
  );
  if (latest) {
    const last = new Date(latest.submittedAtIso).getTime();
    const remaining = remainingMs(last, now);
    if (remaining > 0) {
      lastSubmitMap().set(normalized, last);
      return {
        limited: true,
        retryAfterSeconds: Math.ceil(remaining / 1000),
      };
    }
  }

  return { limited: false };
}

export function recordSubmitRateLimit(email: string): void {
  lastSubmitMap().set(email.trim().toLowerCase(), Date.now());
}

export function formatRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes <= 1) {
    return "You can submit one checklist per hour. Please try again in about a minute.";
  }
  return `You can submit one checklist per hour. Please try again in about ${minutes} minutes.`;
}
