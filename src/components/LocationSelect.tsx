"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  LOCATION_OPTIONS,
  formatLocations,
  parseLocations,
} from "@/lib/stations";

type LocationSelectProps = {
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
};

export function LocationSelect({
  value,
  onChange,
  "aria-label": ariaLabel = "Location",
}: LocationSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseLocations(value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(formatLocations(next));
  }

  const label = selected.length > 0 ? selected.join(", ") : "Select…";

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-9 w-full items-center justify-center rounded-md border border-black/10 bg-white/80 px-1.5 py-1.5 text-center text-[12px] leading-tight text-inherit outline-none ring-brand-orange focus:border-brand-orange focus:bg-white focus:ring-1 sm:text-sm"
      >
        <span className="line-clamp-2 break-words">{label}</span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label={ariaLabel}
          className="absolute left-1/2 z-30 mt-1 max-h-48 w-[min(12rem,70vw)] -translate-x-1/2 overflow-y-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-xl [-webkit-overflow-scrolling:touch]"
        >
          {LOCATION_OPTIONS.map((option) => {
            const checked = selected.includes(option);
            return (
              <li key={option} role="option" aria-selected={checked}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option)}
                    className="size-4 accent-[var(--brand-orange)]"
                  />
                  <span>{option}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
