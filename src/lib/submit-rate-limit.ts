import { FieldValue } from "firebase-admin/firestore";
import { FIRESTORE, getDb } from "@/lib/firebase/admin";
import { getLatestReportForEmail } from "@/lib/reports-store";

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

function rateLimitDocId(email: string): string {
  return email.trim().toLowerCase().replace(/\//g, "_");
}

async function getLastSubmitMs(email: string): Promise<number | null> {
  const normalized = email.trim().toLowerCase();
  const db = getDb();

  if (db) {
    try {
      const doc = await db
        .collection(FIRESTORE.rateLimits)
        .doc(rateLimitDocId(normalized))
        .get();

      if (doc.exists) {
        const data = doc.data() as { lastSubmitIso?: string };
        if (data.lastSubmitIso) {
          return new Date(data.lastSubmitIso).getTime();
        }
      }
    } catch (error) {
      console.error("Firestore rate limit read failed, falling back:", error);
    }
  }

  const latest = await getLatestReportForEmail(normalized);
  if (!latest) return null;
  return new Date(latest.submittedAtIso).getTime();
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

  const lastSubmitMs = await getLastSubmitMs(normalized);
  if (lastSubmitMs !== null) {
    const remaining = remainingMs(lastSubmitMs, now);
    if (remaining > 0) {
      lastSubmitMap().set(normalized, lastSubmitMs);
      return {
        limited: true,
        retryAfterSeconds: Math.ceil(remaining / 1000),
      };
    }
  }

  return { limited: false };
}

export async function recordSubmitRateLimit(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  lastSubmitMap().set(normalized, Date.now());

  const db = getDb();
  if (!db) return;

  try {
    await db.collection(FIRESTORE.rateLimits).doc(rateLimitDocId(normalized)).set({
      lastSubmitIso: nowIso,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Firestore rate limit write failed:", error);
  }
}

export function formatRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes <= 1) {
    return "You can submit one checklist per hour. Please try again in about a minute.";
  }
  return `You can submit one checklist per hour. Please try again in about ${minutes} minutes.`;
}
