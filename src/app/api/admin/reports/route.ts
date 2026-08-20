import { NextResponse } from "next/server";
import { getAdminSessionEmail } from "@/lib/admin-auth";
import { listReports } from "@/lib/reports-store";

export async function GET() {
  const email = await getAdminSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const reports = await listReports();
  return NextResponse.json({ reports });
}
