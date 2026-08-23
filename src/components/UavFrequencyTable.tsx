"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_UAV_FREQUENCY_ROWS,
  bandRowClass,
  createEmptyRow,
  frequencyBand,
  loadUavFrequencyRows,
  saveUavFrequencyRows,
  type UavFrequencyRow,
} from "@/lib/uav-frequency-table";

type EditableField = keyof Pick<UavFrequencyRow, "id" | "uav" | "frequency" | "location">;

const cellInputClass =
  "w-full min-w-0 rounded border border-black/10 bg-white/70 px-2 py-1.5 text-sm text-inherit outline-none ring-brand-orange focus:border-brand-orange focus:bg-white focus:ring-1";

export function UavFrequencyTable() {
  const [rows, setRows] = useState<UavFrequencyRow[]>([]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRows(loadUavFrequencyRows());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveUavFrequencyRows(rows);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [rows, ready]);

  function updateRow(key: string, field: EditableField, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function resetDefaults() {
    if (
      !window.confirm(
        "Reset the table to the original values? Your edits will be lost.",
      )
    ) {
      return;
    }
    setRows([...DEFAULT_UAV_FREQUENCY_ROWS]);
  }

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading table…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-white"
        >
          Add row
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted hover:text-white"
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
          className={`w-full text-xs sm:w-auto sm:ml-auto ${saved ? "text-emerald-400" : "text-muted"}`}
          aria-live="polite"
        >
          {saved ? "Saved on this device" : "Edits save automatically on this device"}
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
              <th className="border border-black/80 px-2 py-2.5 font-bold w-12">
                <span className="sr-only">Remove row</span>
              </th>
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
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) =>
                            updateRow(row.key, field, e.target.value)
                          }
                          aria-label={`${field} for row ${row.id || row.key}`}
                          className={cellInputClass}
                        />
                      </td>
                    ),
                  )}
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
