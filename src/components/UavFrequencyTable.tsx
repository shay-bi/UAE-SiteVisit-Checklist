"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadUser } from "@/lib/auth";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  bandRowClass,
  createEmptyRow,
  frequencyBand,
  type UavFrequencyRow,
} from "@/lib/uav-frequency-table";

type EditableField = keyof Pick<
  UavFrequencyRow,
  "id" | "uav" | "frequency" | "location"
>;

type SaveState = "idle" | "saving" | "saved" | "error";

const cellInputClass =
  "w-full min-w-0 rounded border border-black/10 bg-white/70 px-2 py-1.5 text-sm text-inherit outline-none ring-brand-orange focus:border-brand-orange focus:bg-white focus:ring-1";

const SAVE_DEBOUNCE_MS = 600;

export function UavFrequencyTable() {
  const [rows, setRows] = useState<UavFrequencyRow[]>([]);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const rowsRef = useRef<UavFrequencyRow[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const skipSaveRef = useRef(true);

  const persistRows = useCallback(async (nextRows: UavFrequencyRow[]) => {
    const user = loadUser();
    if (!user) {
      setSaveState("error");
      setErrorMessage("Sign in from the checklist page to save edits for everyone.");
      return;
    }

    setSaveState("saving");
    setErrorMessage("");

    try {
      const res = await fetch("/api/uav-frequency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeEmail: user.email,
          rows: nextRows,
        }),
      });

      const data = (await res.json()) as { error?: string; rows?: UavFrequencyRow[] };

      if (!res.ok) {
        setSaveState("error");
        setErrorMessage(data.error ?? "Could not save the shared table.");
        return;
      }

      if (data.rows) {
        rowsRef.current = data.rows;
        setRows(data.rows);
      }

      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
      setErrorMessage("Network error while saving. Check your connection.");
    }
  }, []);

  useEffect(() => {
    async function loadRows() {
      const user = loadUser();
      setCanEdit(Boolean(user));

      try {
        const res = await fetch("/api/uav-frequency", { cache: "no-store" });
        const data = (await res.json()) as { rows?: UavFrequencyRow[] };
        const nextRows =
          data.rows && data.rows.length > 0
            ? data.rows
            : [...DEFAULT_UAV_FREQUENCY_ROWS];
        rowsRef.current = nextRows;
        setRows(nextRows);
      } catch {
        rowsRef.current = [...DEFAULT_UAV_FREQUENCY_ROWS];
        setRows([...DEFAULT_UAV_FREQUENCY_ROWS]);
        setSaveState("error");
        setErrorMessage("Could not load the shared table. Showing defaults.");
      } finally {
        skipSaveRef.current = true;
        setReady(true);
      }
    }

    void loadRows();
  }, []);

  useEffect(() => {
    if (!ready || skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    if (!canEdit) return;

    rowsRef.current = rows;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistRows(rows);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [rows, ready, canEdit, persistRows]);

  function updateRow(key: string, field: EditableField, value: string) {
    if (!canEdit) return;
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    if (!canEdit) return;
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    if (!canEdit) return;
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  async function resetDefaults() {
    if (!canEdit) return;
    if (
      !window.confirm(
        "Reset the shared table to the original values for everyone?",
      )
    ) {
      return;
    }

    const user = loadUser();
    if (!user) return;

    setSaveState("saving");
    setErrorMessage("");

    try {
      const res = await fetch("/api/uav-frequency", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeEmail: user.email }),
      });

      const data = (await res.json()) as {
        error?: string;
        rows?: UavFrequencyRow[];
      };

      if (!res.ok) {
        setSaveState("error");
        setErrorMessage(data.error ?? "Could not reset the shared table.");
        return;
      }

      const nextRows = data.rows ?? [...DEFAULT_UAV_FREQUENCY_ROWS];
      skipSaveRef.current = true;
      rowsRef.current = nextRows;
      setRows(nextRows);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
      setErrorMessage("Network error while resetting. Check your connection.");
    }
  }

  const statusText =
    saveState === "saving"
      ? "Saving for everyone…"
      : saveState === "saved"
        ? "Saved — shared with the team"
        : canEdit
          ? "Edits save automatically for everyone"
          : "View only — sign in from the checklist to edit";

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading table…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!canEdit && (
        <div className="rounded-lg border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 text-sm text-white">
          This table is shared for the whole team.{" "}
          <Link href="/" className="font-semibold text-brand-orange underline">
            Sign in on the checklist page
          </Link>{" "}
          to edit it.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={!canEdit || saveState === "saving"}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          Add row
        </button>
        <button
          type="button"
          onClick={() => void resetDefaults()}
          disabled={!canEdit || saveState === "saving"}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted hover:text-white disabled:opacity-50"
        >
          Reset to default
        </button>
        <Link
          href="/"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white sm:ml-auto"
        >
          Back to checklist
        </Link>
        <p
          className={`w-full text-xs sm:w-auto sm:ml-auto ${
            saveState === "saved"
              ? "text-emerald-400"
              : saveState === "error"
                ? "text-red-300"
                : "text-muted"
          }`}
          aria-live="polite"
        >
          {errorMessage || statusText}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-black/80 bg-white shadow-lg">
        <table className="min-w-[640px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#1c4587] text-left text-white">
              <th className="border border-black/80 px-3 py-2.5 font-bold">ID</th>
              <th className="border border-black/80 px-3 py-2.5 font-bold">UAV</th>
              <th className="border border-black/80 px-3 py-2.5 font-bold">
                Frequency
              </th>
              <th className="border border-black/80 px-3 py-2.5 font-bold">
                Location
              </th>
              {canEdit && (
                <th className="border border-black/80 px-2 py-2.5 font-bold w-12">
                  <span className="sr-only">Remove row</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const band = frequencyBand(row.frequency);
              const rowClass = bandRowClass(band);
              return (
                <tr key={row.key} className={rowClass}>
                  {(["id", "uav", "frequency", "location"] as const).map(
                    (field) => (
                      <td
                        key={field}
                        className="border border-black/80 px-2 py-1.5 align-top"
                      >
                        {canEdit ? (
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
                          <span className="block px-1 py-1.5">{row[field] || "—"}</span>
                        )}
                      </td>
                    ),
                  )}
                  {canEdit && (
                    <td className="border border-black/80 px-1 py-1.5 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        aria-label={`Remove row ${row.id || row.key}`}
                        className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#d9ead3] ring-1 ring-black/20" />
          433.1 MHz
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#fff2cc] ring-1 ring-black/20" />
          433.9 MHz
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#efefef] ring-1 ring-black/20" />
          434.75 MHz
        </span>
      </div>
    </div>
  );
}
