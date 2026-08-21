"use client";

import { useMemo, useState } from "react";
import {
  SAFETY_CHECKLIST,
  requiredChecklistItemIds,
} from "@/lib/checklist";
import type { StoredUser } from "@/lib/auth";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "min-h-12 rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2";

type FailureFormProps = {
  user: StoredUser;
};

export function FailureForm({ user }: FailureFormProps) {
  const requiredItemIds = useMemo(() => requiredChecklistItemIds(), []);
  const [siteLocation, setSiteLocation] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function validate(): string | null {
    if (!siteLocation.trim()) return "Site + Failure is required.";
    const missing = requiredItemIds.filter((id) => !checked[id]);
    if (missing.length > 0) {
      return "Please complete all required checklist items.";
    }
    if (!notes.trim()) return "Additional notes are required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("submitting");

    const checkedItemIds = [
      ...requiredItemIds,
      ...SAFETY_CHECKLIST.filter((g) => g.optional)
        .flatMap((g) => g.items.map((i) => i.id))
        .filter((id) => checked[id]),
    ];

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: user.name,
          employeeEmail: user.email,
          siteLocation: siteLocation.trim(),
          checkedItemIds,
          notes: notes.trim(),
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setSiteLocation("");
      setChecked({});
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
          Your checklist was submitted successfully.
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">
          Site + Failure <span className="text-brand-orange">*</span>
        </span>
        <input
          required
          name="siteLocation"
          value={siteLocation}
          onChange={(e) => setSiteLocation(e.target.value)}
          placeholder="e.g. site name + failure details"
          className={fieldClass}
        />
      </label>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Safety checklist <span className="text-brand-orange">*</span>
          </h2>
        </div>

        {SAFETY_CHECKLIST.map((group) => {
          const isDanger = group.variant === "danger";
          return (
            <section
              key={group.id}
              className={
                isDanger
                  ? "rounded-xl border-2 border-red-500/70 bg-red-950/40 p-4 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]"
                  : "rounded-xl border border-border bg-surface p-4"
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={
                    isDanger
                      ? "text-xs font-semibold uppercase tracking-[0.12em] text-red-400"
                      : "text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange"
                  }
                >
                  {group.title}
                </h3>
                {group.optional && (
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                    Only if flight needed
                  </span>
                )}
              </div>
              <ul className="mt-3 flex flex-col gap-3">
                {group.items.map((item) => {
                  const on = Boolean(checked[item.id]);
                  return (
                    <li key={item.id} className="flex flex-col gap-2">
                      <label className="flex min-h-11 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          required={!group.optional}
                          checked={on}
                          onChange={() => toggleItem(item.id)}
                          className={
                            isDanger
                              ? "mt-1 size-5 shrink-0 rounded border-red-400 accent-red-500"
                              : "mt-1 size-5 shrink-0 rounded border-border accent-[var(--brand-orange)]"
                          }
                        />
                        <span className="text-base leading-snug text-foreground">
                          {item.label}
                        </span>
                      </label>
                      {item.action && (
                        <a
                          href={item.action.href}
                          className="ml-8 inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white"
                        >
                          {item.action.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">
          Additional notes <span className="text-brand-orange">*</span>
        </span>
        <textarea
          required
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
