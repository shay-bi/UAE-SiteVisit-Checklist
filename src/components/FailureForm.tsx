"use client";

import { useMemo, useState } from "react";
import { SAFETY_CHECKLIST, STAGE_LABELS } from "@/lib/checklist";
import type { FailureStage } from "@/lib/types";

const STAGES: FailureStage[] = ["before", "during", "end"];

type Status = "idle" | "submitting" | "success" | "error";

export function FailureForm() {
  const [employeeName, setEmployeeName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [stage, setStage] = useState<FailureStage>("before");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const groups = useMemo(() => SAFETY_CHECKLIST[stage], [stage]);

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleStageChange(next: FailureStage) {
    setStage(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const checkedItemIds = Object.entries(checked)
      .filter(([, on]) => on)
      .map(([id]) => id);

    const relevantNotes: Record<string, string> = {};
    for (const id of checkedItemIds) {
      const note = itemNotes[id]?.trim();
      if (note) relevantNotes[id] = note;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName,
          siteLocation,
          stage,
          checkedItemIds,
          itemNotes: relevantNotes,
          notes,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setChecked({});
      setItemNotes({});
      setNotes("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">Report sent</p>
        <p className="mt-2 text-sm text-emerald-800">
          Your {STAGE_LABELS[stage].toLowerCase()} checklist was emailed to
          operations.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-emerald-800 px-4 py-3.5 text-base font-medium text-white active:bg-emerald-900"
          onClick={() => setStatus("idle")}
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">
          Employee name
        </span>
        <input
          required
          name="employeeName"
          autoComplete="name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          placeholder="Your full name"
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none ring-sky-600 focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">
          Site / location
        </span>
        <input
          name="siteLocation"
          value={siteLocation}
          onChange={(e) => setSiteLocation(e.target.value)}
          placeholder="e.g. site name or address"
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none ring-sky-600 focus:ring-2"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">
          Report stage
        </legend>
        <div className="grid gap-2">
          {STAGES.map((s) => {
            const selected = stage === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStageChange(s)}
                className={`min-h-12 rounded-xl border px-4 text-left text-base font-medium transition-colors ${
                  selected
                    ? "border-sky-700 bg-sky-700 text-white"
                    : "border-slate-300 bg-white text-slate-800 active:bg-slate-50"
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Safety mechanisms
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Placeholder items — we will replace these with your real checklist.
          </p>
        </div>

        {groups.map((group) => (
          <section
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {group.items.map((item) => {
                const on = Boolean(checked[item.id]);
                return (
                  <li key={item.id} className="flex flex-col gap-2">
                    <label className="flex min-h-11 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleItem(item.id)}
                        className="mt-1 size-5 shrink-0 rounded border-slate-400 accent-sky-700"
                      />
                      <span className="text-base leading-snug text-slate-800">
                        {item.label}
                      </span>
                    </label>
                    {on && (
                      <input
                        type="text"
                        value={itemNotes[item.id] ?? ""}
                        onChange={(e) =>
                          setItemNotes((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Optional note for this item"
                        className="ml-8 min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-sky-600 focus:ring-2"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">
          Additional notes
        </span>
        <textarea
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else operations should know…"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-sky-600 focus:ring-2"
        />
      </label>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="sticky bottom-4 min-h-14 w-full rounded-xl bg-slate-900 px-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-60 active:bg-slate-800"
      >
        {status === "submitting" ? "Sending…" : "Submit report"}
      </button>
    </form>
  );
}
