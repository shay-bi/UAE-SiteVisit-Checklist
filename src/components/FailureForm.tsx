"use client";

import { useState } from "react";
import { SAFETY_CHECKLIST } from "@/lib/checklist";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "min-h-12 rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2";

export function FailureForm() {
  const [employeeName, setEmployeeName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
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
      <div className="rounded-xl border border-brand-orange/40 bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-white">Report sent</p>
        <p className="mt-2 text-sm text-muted">
          Your checklist was emailed to operations.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-brand-orange px-4 py-3.5 text-base font-semibold text-white active:bg-brand-orange-hover"
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
        <span className="text-sm font-medium text-muted">Employee name</span>
        <input
          required
          name="employeeName"
          autoComplete="name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          placeholder="Your full name"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">Site / location</span>
        <input
          name="siteLocation"
          value={siteLocation}
          onChange={(e) => setSiteLocation(e.target.value)}
          placeholder="e.g. site name or address"
          className={fieldClass}
        />
      </label>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Safety mechanisms
          </h2>
          <p className="mt-1 text-sm text-muted">
            Placeholder items — we will replace these with your real checklist.
          </p>
        </div>

        {SAFETY_CHECKLIST.map((group) => (
          <section
            key={group.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
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
                        className="mt-1 size-5 shrink-0 rounded border-border accent-[var(--brand-orange)]"
                      />
                      <span className="text-base leading-snug text-foreground">
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
                        className="ml-8 min-h-11 rounded-lg border border-border bg-surface-elevated px-3 text-sm text-white outline-none ring-brand-orange focus:ring-2"
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
        <span className="text-sm font-medium text-muted">Additional notes</span>
        <textarea
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else operations should know…"
          className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2"
        />
      </label>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="sticky bottom-4 min-h-14 w-full rounded-lg bg-brand-orange px-4 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 disabled:opacity-60 active:brightness-110"
      >
        {status === "submitting" ? "Sending…" : "Submit report"}
      </button>
    </form>
  );
}
