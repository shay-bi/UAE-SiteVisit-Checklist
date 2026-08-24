"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHEAT_SHEET_PARTS,
  sectionMatches,
  type CheatSheetPart,
  type CheatSheetSection,
} from "@/lib/cheat-sheet";

type CheatSheetProps = {
  sections: CheatSheetSection[];
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const lower = q.toLowerCase();
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lower ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-brand-orange/45 text-white"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CheatSheet({ sections }: CheatSheetProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [part, setPart] = useState<CheatSheetPart | "all">("all");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => {
    return sections.filter((section) => {
      if (part !== "all" && section.part !== part) return false;
      return sectionMatches(section, query);
    });
  }, [sections, part, query]);

  const matchCount = useMemo(
    () => sections.filter((section) => sectionMatches(section, query)).length,
    [sections, query],
  );

  async function copySection(section: CheatSheetSection) {
    const text = section.body
      ? `${section.title}\n${section.body}`
      : section.title;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(section.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-16 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Cheat Sheet</h1>
        <p className="mt-1 text-sm text-muted">
          Search IPs, passwords, and procedures. Content is the team cheat
          sheet as written.
        </p>
      </header>

      <div className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <label className="sr-only" htmlFor="cheat-sheet-search">
          Search cheat sheet
        </label>
        <input
          id="cheat-sheet-search"
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search… (press /)"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-12 w-full rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2"
        />
        <p className="mt-2 text-xs text-muted">
          {query.trim()
            ? `${matchCount} match${matchCount === 1 ? "" : "es"}`
            : `${sections.length} sections`}
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <button
            type="button"
            onClick={() => setPart("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              part === "all"
                ? "bg-brand-orange text-white"
                : "border border-border text-muted"
            }`}
          >
            All
          </button>
          {CHEAT_SHEET_PARTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPart(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                part === item.id
                  ? "bg-brand-orange text-white"
                  : "border border-border text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 1 && (
        <nav
          aria-label="Jump to section"
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
        >
          {visible.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-white"
            >
              {section.title.replace(/-$/, "")}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
            No matches. Try an IP, password, or a shorter word.
          </p>
        ) : (
          visible.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-36 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange">
                    {CHEAT_SHEET_PARTS.find((item) => item.id === section.part)
                      ?.label}
                  </p>
                  <h2 className="mt-1 text-base font-semibold leading-snug text-white">
                    <HighlightedText text={section.title} query={query} />
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void copySection(section)}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:text-white"
                >
                  {copiedId === section.id ? "Copied" : "Copy"}
                </button>
              </div>
              {section.body ? (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground">
                  <HighlightedText text={section.body} query={query} />
                </pre>
              ) : null}
            </article>
          ))
        )}
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-white"
      >
        Back to checklist
      </Link>
    </div>
  );
}
