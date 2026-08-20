"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearUser,
  isAdminUser,
  loadUser,
  type StoredUser,
} from "@/lib/auth";
import { FailureForm } from "@/components/FailureForm";
import { SignInForm } from "@/components/SignInForm";

export function SiteVisitApp() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!user) {
    return <SignInForm onSignedIn={setUser} />;
  }

  const showAdminButton = isAdminUser(user);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearUser();
            setUser(null);
          }}
          className="shrink-0 text-xs font-medium text-brand-orange underline-offset-2 hover:underline"
        >
          Switch user
        </button>
      </div>

      {showAdminButton && (
        <Link
          href="/admin"
          className="flex min-h-12 items-center justify-center rounded-lg border border-brand-orange bg-brand-orange/15 px-4 text-sm font-semibold text-brand-orange"
        >
          Admin panel
        </Link>
      )}

      <FailureForm user={user} />
    </div>
  );
}
