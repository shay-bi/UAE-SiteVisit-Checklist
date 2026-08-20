import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "shaybit@airoboticsdrones.com"
).trim().toLowerCase();

const COOKIE_NAME = "airobotics_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createAdminSessionToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${normalized}|${exp}`;
  return `${payload}|${sign(payload)}`;
}

export function readAdminEmailFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [email, expRaw, signature] = parts;
  const payload = `${email}|${expRaw}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  if (!isAdminEmail(email)) return null;
  return email;
}

export async function getAdminSessionEmail(): Promise<string | null> {
  try {
    const jar = await cookies();
    return readAdminEmailFromToken(jar.get(COOKIE_NAME)?.value);
  } catch {
    return null;
  }
}

export function adminCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function clearAdminCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
