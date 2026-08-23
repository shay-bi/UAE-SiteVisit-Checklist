"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser, loadUser } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Checklist" },
  { href: "/flight-report", label: "Flight Report" },
  { href: "/flights-pricelist", label: "Flights Pricelist" },
  { href: "/uav-frequency", label: "UAVs & Lora IDs" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const user = loadUser();
    setShowAdmin(Boolean(user && isAdminUser(user)));
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = showAdmin
    ? [...NAV, { href: "/admin", label: "Admin panel" } as const]
    : NAV;

  return (
    <div className="relative min-h-full bg-background">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex size-11 items-center justify-center rounded-lg border border-border bg-surface text-white shadow-lg"
      >
        <span className="flex flex-col gap-1.5" aria-hidden>
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
        </span>
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <p className="text-sm font-semibold tracking-wide text-white">
            Menu
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:text-white"
          >
            Close
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-orange/20 text-brand-orange"
                    : "text-white hover:bg-surface-elevated"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-full">{children}</div>
    </div>
  );
}
