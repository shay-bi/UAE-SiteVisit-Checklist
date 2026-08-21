"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { StoredReport } from "@/lib/report";

const fieldClass =
  "min-h-12 rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2";

export function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReports = useCallback(async () => {
    setLoadError("");
    const res = await fetch("/api/admin/reports");
    if (res.status === 401) {
      setAuthed(false);
      setReports([]);
      return;
    }
    if (!res.ok) {
      setLoadError("Could not load reports.");
      return;
    }
    const data = (await res.json()) as { reports: StoredReport[] };
    setAuthed(true);
    setReports(data.reports);
  }, []);

  useEffect(() => {
    loadReports().finally(() => setChecking(false));
  }, [loadReports]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoginError(data.error ?? "Login failed.");
        return;
      }
      setPassword("");
      await loadReports();
    } catch {
      setLoginError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setReports([]);
    setSelectedId(null);
  }

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  if (checking) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading admin…
      </p>
    );
  }

  if (!authed) {
    return (
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Admin login</h2>
          <p className="mt-1 text-sm text-muted">
            Restricted to your Airobotics admin email.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="shaybit@airoboticsdrones.com"
            className={fieldClass}
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete="current-password"
          />
        </label>

        {loginError && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200"
          >
            {loginError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-14 w-full rounded-lg bg-brand-orange px-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <Link
          href="/"
          className="flex min-h-12 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-white"
        >
          Regular view
        </Link>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/"
        className="flex min-h-12 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-white"
      >
        Regular view
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All reports</h2>
          <p className="text-sm text-muted">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadReports()}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-white"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-brand-orange"
          >
            Log out
          </button>
        </div>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {loadError}
        </p>
      )}

      {reports.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          No reports yet. When employees submit the checklist, they will appear
          here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((report) => (
            <li key={report.id}>
              <button
                type="button"
                onClick={() =>
                  setSelectedId((id) => (id === report.id ? null : report.id))
                }
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  selectedId === report.id
                    ? "border-brand-orange bg-surface-elevated"
                    : "border-border bg-surface"
                }`}
              >
                <p className="font-medium text-white">{report.employeeName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {report.siteLocation} · {report.submittedAtUae}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <article className="rounded-xl border border-brand-orange/40 bg-surface p-4">
          <h3 className="text-base font-semibold text-white">Report detail</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted">Employee</dt>
              <dd className="text-white">
                {selected.employeeName} ({selected.employeeEmail})
              </dd>
            </div>
            <div>
              <dt className="text-muted">Station</dt>
              <dd className="text-white">{selected.siteLocation}</dd>
            </div>
            <div>
              <dt className="text-muted">Submitted (UAE)</dt>
              <dd className="text-white">{selected.submittedAtUae}</dd>
            </div>
            <div>
              <dt className="text-muted">Safety checklist</dt>
              <dd>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-white">
                  {selected.checkedLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Notes</dt>
              <dd className="whitespace-pre-wrap text-white">{selected.notes}</dd>
            </div>
          </dl>
        </article>
      )}
    </div>
  );
}
