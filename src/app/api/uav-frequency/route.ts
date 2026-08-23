import { NextResponse } from "next/server";
import { isWorkEmail } from "@/lib/auth";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  isValidUavFrequencyRows,
} from "@/lib/uav-frequency-table";
import {
  getUavFrequencyRows,
  saveUavFrequencyRows,
} from "@/lib/uav-frequency-store";

export async function GET() {
  const rows = await getUavFrequencyRows();
  return NextResponse.json({ rows });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const employeeEmail =
    typeof record.employeeEmail === "string"
      ? record.employeeEmail.trim().toLowerCase()
      : "";

  if (!isWorkEmail(employeeEmail)) {
    return NextResponse.json(
      {
        error:
          "Sign in with your @airoboticsdrones.com email to edit the shared table.",
      },
      { status: 401 },
    );
  }

  if (!isValidUavFrequencyRows(record.rows)) {
    return NextResponse.json({ error: "Invalid table data." }, { status: 400 });
  }

  await saveUavFrequencyRows(record.rows);

  return NextResponse.json({ ok: true, rows: record.rows });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const employeeEmail =
    typeof record.employeeEmail === "string"
      ? record.employeeEmail.trim().toLowerCase()
      : "";

  if (!isWorkEmail(employeeEmail)) {
    return NextResponse.json(
      {
        error:
          "Sign in with your @airoboticsdrones.com email to reset the shared table.",
      },
      { status: 401 },
    );
  }

  await saveUavFrequencyRows([...DEFAULT_UAV_FREQUENCY_ROWS]);
  return NextResponse.json({ ok: true, rows: DEFAULT_UAV_FREQUENCY_ROWS });
}
