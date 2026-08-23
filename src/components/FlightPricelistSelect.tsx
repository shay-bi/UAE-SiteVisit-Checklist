"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterFlightPricelists } from "@/lib/flight-pricelists";

type FlightPricelistSelectProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  className?: string;
};

export function FlightPricelistSelect({
  value,
  onChange,
  name = "flightPricelist",
  required = false,
  className = "",
}: FlightPricelistSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => filterFlightPricelists(query), [query]);

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

  function selectOption(option: string) {
    onChange(option);
    setQuery(option);
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
        selectOption(filtered[activeIndex]);
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
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filtered[activeIndex]
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        placeholder="Search pricelist…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="min-h-12 w-full rounded-lg border border-red-400/40 bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-red-500 focus:ring-2"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Flight pricelist"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-xl [-webkit-overflow-scrolling:touch]"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No pricelist item found</li>
          ) : (
            filtered.map((option, index) => {
              const active = index === activeIndex;
              const selected = option === value;
              return (
                <li
                  key={option}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  className={`cursor-pointer px-4 py-3 text-sm leading-snug ${
                    active
                      ? "bg-brand-orange/20 text-brand-orange"
                      : "text-white hover:bg-surface"
                  } ${selected ? "font-semibold" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(option);
                  }}
                >
                  {option}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
