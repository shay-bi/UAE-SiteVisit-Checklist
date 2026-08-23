import { NextResponse } from "next/server";
import {
  getUavFrequencyRows,
  listPendingProposals,
} from "@/lib/uav-frequency-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includePending = searchParams.get("pending") === "1";

  const rows = await getUavFrequencyRows();

  if (!includePending) {
    return NextResponse.json({ rows });
  }

  const pending = await listPendingProposals();
  return NextResponse.json({ rows, pending });
}
