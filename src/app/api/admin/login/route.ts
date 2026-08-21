import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminEmail,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body &&
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  const password =
    typeof body === "object" &&
    body &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!isAdminEmail(email)) {
    return NextResponse.json(
      { error: "Only the admin account can access this panel." },
      { status: 403 },
    );
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    const missing = [
      !process.env.ADMIN_PASSWORD ? "ADMIN_PASSWORD" : null,
      !process.env.ADMIN_SESSION_SECRET ? "ADMIN_SESSION_SECRET" : null,
    ].filter(Boolean);
    return NextResponse.json(
      {
        error: `Admin login is not configured on the server. Missing: ${missing.join(", ")}. Add it in Vercel → Settings → Environment Variables, then redeploy.`,
      },
      { status: 500 },
    );
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 },
    );
  }

  const token = createAdminSessionToken(ADMIN_EMAIL);
  const response = NextResponse.json({ ok: true, email: ADMIN_EMAIL });
  response.cookies.set(adminCookieOptions(token));
  return response;
}
