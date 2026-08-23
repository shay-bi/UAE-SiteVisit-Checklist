import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { isWorkEmail } from "@/lib/auth";
import {
  createProposal,
  getProposal,
  getUavFrequencyRows,
  listPendingProposals,
  saveUavFrequencyRows,
  updateProposal,
} from "@/lib/uav-frequency-store";
import {
  isValidUavFrequencyRows,
  rowsEqual,
  summarizeRowDiff,
} from "@/lib/uav-frequency-table";
import { sendProposalNotificationEmail } from "@/lib/uav-proposal-email";

export async function GET() {
  const pending = await listPendingProposals();
  return NextResponse.json({ pending });
}

export async function POST(request: Request) {
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
  const employeeName =
    typeof record.employeeName === "string" ? record.employeeName.trim() : "";
  const employeeEmail =
    typeof record.employeeEmail === "string"
      ? record.employeeEmail.trim().toLowerCase()
      : "";
  const action = typeof record.action === "string" ? record.action : "propose";

  if (action === "propose") {
    if (!employeeName || !isWorkEmail(employeeEmail)) {
      return NextResponse.json(
        {
          error:
            "Sign in with your @airoboticsdrones.com email to propose changes.",
        },
        { status: 401 },
      );
    }

    if (!isValidUavFrequencyRows(record.rows)) {
      return NextResponse.json({ error: "Invalid table data." }, { status: 400 });
    }

    const published = await getUavFrequencyRows();
    if (rowsEqual(published, record.rows)) {
      return NextResponse.json(
        { error: "No changes to submit." },
        { status: 400 },
      );
    }

    const proposal = await createProposal({
      rows: record.rows,
      proposedByName: employeeName,
      proposedByEmail: employeeEmail,
    });

    const changes = summarizeRowDiff(published, record.rows);
    const origin = new URL(request.url).origin;
    await sendProposalNotificationEmail({
      proposal,
      changes,
      reviewUrl: `${origin}/uav-frequency`,
    });

    return NextResponse.json({ ok: true, proposal });
  }

  if (action === "approve" || action === "reject") {
    if (!isAdminEmail(employeeEmail)) {
      return NextResponse.json(
        { error: "Only the admin can approve or reject proposals." },
        { status: 403 },
      );
    }

    const proposalId =
      typeof record.proposalId === "string" ? record.proposalId.trim() : "";
    if (!proposalId) {
      return NextResponse.json(
        { error: "Missing proposal id." },
        { status: 400 },
      );
    }

    const proposal = await getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }
    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "This proposal was already reviewed." },
        { status: 409 },
      );
    }

    if (action === "approve") {
      await saveUavFrequencyRows(proposal.rows, employeeEmail);
      proposal.status = "approved";
    } else {
      proposal.status = "rejected";
    }

    proposal.reviewedAtIso = new Date().toISOString();
    proposal.reviewedByEmail = employeeEmail;
    await updateProposal(proposal);

    const rows = await getUavFrequencyRows();
    const pending = await listPendingProposals();
    return NextResponse.json({ ok: true, proposal, rows, pending });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
