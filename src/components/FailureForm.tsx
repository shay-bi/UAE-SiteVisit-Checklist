"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  FLIGHT_GATE_ITEM_ID,
  SAFETY_CHECKLIST,
  isFlightSectionActive,
  requiredChecklistItemIds,
} from "@/lib/checklist";
import type { StoredUser } from "@/lib/auth";
import {
  clearFormDraft,
  loadFormDraft,
  saveFormDraft,
  type FormDraft,
} from "@/lib/form-draft";
import { isValidFlightPricelist } from "@/lib/flight-pricelists";
import { isValidStation } from "@/lib/stations";
import type { ChecklistItem } from "@/lib/types";
import { FlightPricelistSelect } from "@/components/FlightPricelistSelect";
import { StationSelect } from "@/components/StationSelect";

type Status = "idle" | "submitting" | "success" | "error";

type FailureFormProps = {
  user: StoredUser;
};

function ChecklistItemLabel({ item }: { item: ChecklistItem }) {
  const link = item.inlineLink;
  const hasBullets = Boolean(item.bullets?.length);

  let main: React.ReactNode = null;
  if (!hasBullets || item.label.trim()) {
    if (!link) {
      main = (
        <span className="text-base leading-snug text-foreground">
          {item.label}
        </span>
      );
    } else {
      const index = item.label.indexOf(link.text);
      if (index === -1) {
        main = (
          <span className="text-base leading-snug text-foreground">
            {item.label}
          </span>
        );
      } else {
        main = (
          <span className="text-base leading-snug text-foreground">
            {item.label.slice(0, index)}
            <Link
              href={link.href}
              className="font-semibold text-brand-orange underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {link.text}
            </Link>
            {item.label.slice(index + link.text.length)}
          </span>
        );
      }
    }
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
      {main}
      {hasBullets && (
        <ul className="flex flex-col gap-1 text-base leading-snug text-foreground">
          {item.bullets!.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="shrink-0 text-muted" aria-hidden>
                -
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

export function FailureForm({ user }: FailureFormProps) {
  const [ready, setReady] = useState(false);
  const [siteLocation, setSiteLocation] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checkedAt, setCheckedAt] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [flightPricelist, setFlightPricelist] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const requiredItemIds = useMemo(
    () => requiredChecklistItemIds(checked),
    [checked],
  );
  const flightActive = isFlightSectionActive(checked);
  const draftRef = useRef<FormDraft>({
    siteLocation: "",
    checked: {},
    checkedAt: {},
    notes: "",
    flightPricelist: "",
  });
  const persistEnabled = useRef(false);

  function persistDraft(next: FormDraft) {
    draftRef.current = next;
    if (!persistEnabled.current) return;
    saveFormDraft(user.email, next);
  }

  useLayoutEffect(() => {
    const draft = loadFormDraft(user.email);
    draftRef.current = draft;
    const station = isValidStation(draft.siteLocation)
      ? draft.siteLocation.trim()
      : "";
    setSiteLocation(station);
    setChecked(draft.checked);
    setCheckedAt(draft.checkedAt ?? {});
    setNotes(draft.notes);
    const pricelist = isValidFlightPricelist(draft.flightPricelist)
      ? draft.flightPricelist.trim()
      : "";
    setFlightPricelist(pricelist);
    if (station !== draft.siteLocation || pricelist !== draft.flightPricelist) {
      draftRef.current = {
        ...draft,
        siteLocation: station,
        flightPricelist: pricelist,
      };
    }
    persistEnabled.current = true;
    setReady(true);
  }, [user.email]);

  // Flush before leaving for any other page / tab hide / refresh.
  useEffect(() => {
    function flush() {
      if (!persistEnabled.current) return;
      saveFormDraft(user.email, draftRef.current);
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user.email]);

  function updateSiteLocation(value: string) {
    setSiteLocation(value);
    persistDraft({ ...draftRef.current, siteLocation: value });
  }

  function updateNotes(value: string) {
    setNotes(value);
    persistDraft({ ...draftRef.current, notes: value });
  }

  function updateFlightPricelist(value: string) {
    setFlightPricelist(value);
    persistDraft({ ...draftRef.current, flightPricelist: value });
  }

  function toggleItem(id: string) {
    setChecked((prev) => {
      const nextOn = !prev[id];
      const nextChecked = { ...prev, [id]: nextOn };
      const nextCheckedAt = { ...(draftRef.current.checkedAt ?? {}) };
      if (nextOn) {
        nextCheckedAt[id] = new Date().toISOString();
      } else {
        delete nextCheckedAt[id];
      }
      setCheckedAt(nextCheckedAt);

      const nextDraft: FormDraft = {
        ...draftRef.current,
        checked: nextChecked,
        checkedAt: nextCheckedAt,
      };
      if (id === FLIGHT_GATE_ITEM_ID && !nextOn) {
        setFlightPricelist("");
        nextDraft.flightPricelist = "";
      }
      persistDraft(nextDraft);
      return nextChecked;
    });
  }

  function validate(): string | null {
    if (!isValidStation(siteLocation)) {
      return "Please select a station from the list.";
    }
    const missing = requiredItemIds.filter((id) => !checked[id]);
    if (missing.length > 0) {
      return "Please complete all required checklist items.";
    }
    if (flightActive && !isValidFlightPricelist(flightPricelist)) {
      return "Please select which flight pricelist item applies.";
    }
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

    const checkedItemIds = SAFETY_CHECKLIST.flatMap((g) =>
      g.items.map((i) => i.id).filter((id) => checked[id]),
    );
    const nowIso = new Date().toISOString();
    const checkedAtByItemId: Record<string, string> = {};
    for (const id of checkedItemIds) {
      checkedAtByItemId[id] = checkedAt[id] || nowIso;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: user.name,
          employeeEmail: user.email,
          siteLocation: siteLocation.trim(),
          checkedItemIds,
          checkedAtByItemId,
          notes: notes.trim(),
          flightPricelist: flightActive ? flightPricelist.trim() : "",
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      persistEnabled.current = false;
      clearFormDraft(user.email);
      draftRef.current = {
        siteLocation: "",
        checked: {},
        checkedAt: {},
        notes: "",
        flightPricelist: "",
      };
      setStatus("success");
      setSiteLocation("");
      setChecked({});
      setCheckedAt({});
      setNotes("");
      setFlightPricelist("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Check your connection and try again.");
    }
  }

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-500/40 bg-surface p-6 text-center"
      >
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40 motion-safe:animate-[success-pop_420ms_ease-out]"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="size-9 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-white">Report sent</p>
        <p className="mt-2 text-sm text-muted">
          Your checklist was submitted successfully.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-brand-orange px-4 py-3.5 text-base font-semibold text-white active:bg-brand-orange-hover"
          onClick={() => {
            persistEnabled.current = true;
            setStatus("idle");
          }}
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
          Station <span className="text-brand-orange">*</span>
        </span>
        <StationSelect
          value={siteLocation}
          onChange={updateSiteLocation}
          required
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
              </div>
              {group.optional &&
                group.items[0] &&
                checked[group.items[0].id] && (
                  <p className="mt-2 text-xs text-red-300/90">
                    Flight started — complete every item in this section.
                  </p>
                )}
              <ul className="mt-3 flex flex-col gap-3">
                {group.items.map((item, index) => {
                  const on = Boolean(checked[item.id]);
                  const sectionGated =
                    Boolean(group.optional) &&
                    Boolean(group.items[0] && checked[group.items[0].id]);
                  const itemRequired =
                    !group.optional || (sectionGated && index > 0);
                  return (
                    <li key={item.id}>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          required={itemRequired}
                          checked={on}
                          onChange={() => toggleItem(item.id)}
                          className={
                            isDanger
                              ? "mt-1 size-5 shrink-0 rounded border-red-400 accent-red-500"
                              : "mt-1 size-5 shrink-0 rounded border-border accent-[var(--brand-orange)]"
                          }
                        />
                        <ChecklistItemLabel item={item} />
                      </label>
                    </li>
                  );
                })}
              </ul>
              {group.id === "flight" && flightActive && (
                <label className="mt-4 flex flex-col gap-2 border-t border-red-500/30 pt-4">
                  <span className="text-sm font-medium text-red-200">
                    Flight pricelist item{" "}
                    <span className="text-red-400">*</span>
                  </span>
                  <p className="text-xs leading-relaxed text-red-300/80">
                    Which pricelist item did you perform? Search and select
                    from the list.
                  </p>
                  <FlightPricelistSelect
                    value={flightPricelist}
                    onChange={updateFlightPricelist}
                    required
                  />
                </label>
              )}
            </section>
          );
        })}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">Additional notes</span>
        <textarea
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder="Anything else operations should know… (optional)"
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
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
