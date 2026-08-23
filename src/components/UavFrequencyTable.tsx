"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isAdminUser, loadUser, type StoredUser } from "@/lib/auth";
import { migrateHomeToFacility } from "@/lib/stations";
import { LocationSelect } from "@/components/LocationSelect";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  bandRowClass,
  createEmptyRow,
  frequencyBand,
  rowsEqual,
  summarizeRowDiff,
  type UavFrequencyProposal,
  type UavFrequencyRow,
} from "@/lib/uav-frequency-table";

type EditableField = keyof Pick<UavFrequencyRow, "id" | "uav" | "frequency">;

type Mode = "view" | "edit";

const cellInputClass =
  "w-full min-w-0 rounded-md border border-black/10 bg-white/80 px-1.5 py-2 text-center text-sm text-inherit outline-none ring-brand-orange focus:border-brand-orange focus:bg-white focus:ring-1";

function migrateRows(rows: UavFrequencyRow[]): UavFrequencyRow[] {
  return rows.map((row) => ({
    ...row,
    location: migrateHomeToFacility(row.location),
  }));
}

export function UavFrequencyTable() {
  const [published, setPublished] = useState<UavFrequencyRow[]>([]);
  const [draft, setDraft] = useState<UavFrequencyRow[]>([]);
  const [pending, setPending] = useState<UavFrequencyProposal[]>([]);
  const [mode, setMode] = useState<Mode>("view");
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = Boolean(user && isAdminUser(user));
  const canPropose = Boolean(user);
  const dirty = useMemo(
    () => mode === "edit" && !rowsEqual(published, draft),
    [mode, published, draft],
  );

  async function loadTable() {
    const signedIn = loadUser();
    setUser(signedIn);

    try {
      const res = await fetch("/api/uav-frequency?pending=1", {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        rows?: UavFrequencyRow[];
        pending?: UavFrequencyProposal[];
      };
      const nextRows = migrateRows(
        data.rows && data.rows.length > 0
          ? data.rows
          : [...DEFAULT_UAV_FREQUENCY_ROWS],
      );
      setPublished(nextRows);
      setDraft(nextRows);
      setPending(data.pending ?? []);
    } catch {
      const defaults = migrateRows([...DEFAULT_UAV_FREQUENCY_ROWS]);
      setPublished(defaults);
      setDraft(defaults);
      setError("Could not load the shared table.");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void loadTable();
  }, []);

  function startEdit() {
    setDraft(published.map((row) => ({ ...row })));
    setMode("edit");
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setDraft(published.map((row) => ({ ...row })));
    setMode("view");
    setNote("");
    setMessage("");
    setError("");
  }

  function updateRow(key: string, field: EditableField, value: string) {
    setDraft((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function updateLocation(key: string, value: string) {
    setDraft((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, location: value } : row,
      ),
    );
  }

  function addRow() {
    setDraft((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    setDraft((prev) => prev.filter((row) => row.key !== key));
  }

  async function submitProposal() {
    if (!user || !dirty) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/uav-frequency/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          employeeName: user.name,
          employeeEmail: user.email,
          rows: draft,
          note,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        proposal?: UavFrequencyProposal;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not submit proposal.");
        return;
      }

      setMode("view");
      setDraft(published.map((row) => ({ ...row })));
      setNote("");
      setMessage("Submitted for approval. You’ll see it live after review.");
      await loadTable();
    } catch {
      setError("Network error while submitting. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewProposal(
    proposalId: string,
    action: "approve" | "reject",
  ) {
    if (!user || !isAdmin) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/uav-frequency/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          proposalId,
          employeeEmail: user.email,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        rows?: UavFrequencyRow[];
        pending?: UavFrequencyProposal[];
      };

      if (!res.ok) {
        setError(data.error ?? `Could not ${action} proposal.`);
        return;
      }

      if (data.rows) {
        setPublished(data.rows);
        if (mode === "view") setDraft(data.rows);
      }
      setPending(data.pending ?? []);
      setMessage(
        action === "approve"
          ? "Approved — table updated for everyone."
          : "Proposal rejected.",
      );
    } catch {
      setError("Network error while reviewing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const displayRows = mode === "edit" ? draft : published;

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading table…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!canPropose && (
        <div className="rounded-xl border border-brand-orange/35 bg-brand-orange/10 px-4 py-3 text-sm leading-relaxed text-white">
          View only.{" "}
          <Link href="/" className="font-semibold text-brand-orange underline">
            Sign in on the checklist
          </Link>{" "}
          to propose changes for approval.
        </div>
      )}

      {canPropose && mode === "view" && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Edits go to approval first — they appear for everyone only after an
          admin approves.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {canPropose && mode === "view" && (
          <button
            type="button"
            onClick={startEdit}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Propose changes
          </button>
        )}
        {mode === "edit" && (
          <>
            <button
              type="button"
              onClick={addRow}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Add row
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-white sm:ml-auto"
        >
          Back to checklist
        </Link>
      </div>

      {mode === "edit" && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Note for approver (optional)
            </span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you change and why?"
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-white outline-none ring-brand-orange focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={() => void submitProposal()}
            disabled={busy || !dirty}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit for approval"}
          </button>
          {!dirty && (
            <p className="text-center text-xs text-muted">
              Make at least one change before submitting.
            </p>
          )}
        </div>
      )}

      {(message || error) && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-center text-sm ${
            error
              ? "border border-red-500/40 bg-red-950/40 text-red-200"
              : "border border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
          }`}
        >
          {error || message}
        </p>
      )}

      {isAdmin && pending.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-brand-orange/40 bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Pending approvals ({pending.length})
          </h2>
          {pending.map((proposal) => {
            const changes = summarizeRowDiff(published, proposal.rows);
            return (
              <article
                key={proposal.id}
                className="rounded-lg border border-border bg-surface-elevated p-3"
              >
                <p className="text-sm text-white">
                  <span className="font-semibold">{proposal.proposedByName}</span>
                  <span className="text-muted">
                    {" "}
                    · {proposal.proposedByEmail}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(proposal.createdAtIso).toLocaleString("en-GB", {
                    timeZone: "Asia/Dubai",
                  })}{" "}
                  (UAE)
                </p>
                {proposal.note && (
                  <p className="mt-2 text-sm text-muted">“{proposal.note}”</p>
                )}
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {(changes.length ? changes : ["Full table update"]).map(
                    (line) => (
                      <li key={line}>• {line}</li>
                    ),
                  )}
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reviewProposal(proposal.id, "approve")}
                    className="min-h-11 rounded-lg bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reviewProposal(proposal.id, "reject")}
                    className="min-h-11 rounded-lg border border-red-400/50 text-sm font-semibold text-red-300 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full overflow-hidden rounded-xl border border-border bg-white shadow-md sm:min-w-0 sm:w-full">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[28%]" />
              <col className="w-[22%]" />
              <col className="w-[26%]" />
              {mode === "edit" && <col className="w-[8%]" />}
            </colgroup>
            <thead>
              <tr className="bg-slate-800 text-white">
                {["ID", "UAV", "Freq", "Location"].map((label) => (
                  <th
                    key={label}
                    className="border-b border-white/10 px-1.5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide sm:text-xs"
                  >
                    {label}
                  </th>
                ))}
                {mode === "edit" && (
                  <th className="border-b border-white/10 px-1 py-2.5">
                    <span className="sr-only">Remove</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const band = frequencyBand(row.frequency);
                return (
                  <tr key={row.key} className={bandRowClass(band)}>
                    {(["id", "uav", "frequency"] as const).map((field) => (
                      <td
                        key={field}
                        className="border-b border-black/5 px-1 py-1 text-center align-middle"
                      >
                        {mode === "edit" ? (
                          <input
                            type="text"
                            value={row[field]}
                            onChange={(e) =>
                              updateRow(row.key, field, e.target.value)
                            }
                            aria-label={`${field} for row ${row.id || row.key}`}
                            className={cellInputClass}
                          />
                        ) : (
                          <span className="block break-words px-0.5 py-2 text-center text-[13px] leading-snug sm:text-sm">
                            {row[field] || "—"}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="border-b border-black/5 px-1 py-1 text-center align-middle">
                      {mode === "edit" ? (
                        <LocationSelect
                          value={row.location}
                          onChange={(value) => updateLocation(row.key, value)}
                          aria-label={`Location for row ${row.id || row.key}`}
                        />
                      ) : (
                        <span className="block break-words px-0.5 py-2 text-center text-[13px] leading-snug sm:text-sm">
                          {row.location || "—"}
                        </span>
                      )}
                    </td>
                    {mode === "edit" && (
                      <td className="border-b border-black/5 px-0.5 py-1 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          aria-label={`Remove row ${row.id || row.key}`}
                          className="size-8 rounded-md text-red-700 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-300" />
          433.1
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-300" />
          433.9
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-300" />
          434.75
        </span>
      </div>
    </div>
  );
}
