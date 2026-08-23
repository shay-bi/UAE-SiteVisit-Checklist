"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const selected = parseLocations(value);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
        width: Math.min(192, window.innerWidth * 0.7),
        zIndex: 50,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function toggle(option: string) {
    const current = parseLocations(value);
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    onChange(formatLocations(next));
  }

  const label = selected.length > 0 ? formatLocations(selected) : "Select…";

  const menu = open ? (
    <div
      ref={menuRef}
      id={listId}
      style={menuStyle}
      className="overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-xl"
      onMouseDown={(e) => e.preventDefault()}
    >
      <p className="border-b border-border px-3 py-2 text-[11px] text-muted">
        Select one or more
      </p>
      <ul
        role="listbox"
        aria-multiselectable
        aria-label={ariaLabel}
        className="max-h-48 overflow-y-auto py-1 [-webkit-overflow-scrolling:touch]"
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
                  className="size-4 shrink-0 accent-[var(--brand-orange)]"
                />
                <span>{option}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-9 w-full rounded-md bg-brand-orange text-sm font-semibold text-white"
        >
          Done
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-9 w-full items-center justify-center rounded-md border border-black/10 bg-white/80 px-1.5 py-1.5 text-center text-[12px] leading-tight text-inherit outline-none ring-brand-orange focus:border-brand-orange focus:bg-white focus:ring-1 sm:text-sm"
      >
        <span className="line-clamp-2 break-words">{label}</span>
      </button>

      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
