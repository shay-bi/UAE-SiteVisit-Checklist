"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { STATIONS } from "@/lib/stations";

type StationSelectProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  className?: string;
};

export function StationSelect({
  value,
  onChange,
  name = "siteLocation",
  required = true,
  className = "",
}: StationSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...STATIONS];
    return STATIONS.filter((station) => station.includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, value]);

  function selectStation(station: string) {
    onChange(station);
    setQuery(station);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        selectStation(filtered[activeIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} required={required} />
      <input
        type="search"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filtered[activeIndex]
            ? `${listId}-option-${filtered[activeIndex]}`
            : undefined
        }
        placeholder="Search station number…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="min-h-12 w-full rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Stations"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-xl [-webkit-overflow-scrolling:touch]"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No station found</li>
          ) : (
            filtered.map((station, index) => {
              const active = index === activeIndex;
              const selected = station === value;
              return (
                <li
                  key={station}
                  id={`${listId}-option-${station}`}
                  role="option"
                  aria-selected={selected}
                  className={`cursor-pointer px-4 py-3 text-base ${
                    active
                      ? "bg-brand-orange/20 text-brand-orange"
                      : "text-white hover:bg-surface"
                  } ${selected ? "font-semibold" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectStation(station);
                  }}
                >
                  {station}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
