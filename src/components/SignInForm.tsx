"use client";

import { useState } from "react";
import {
  WORK_EMAIL_DOMAIN,
  isWorkEmail,
  saveUser,
  type StoredUser,
} from "@/lib/auth";

const fieldClass =
  "min-h-12 rounded-lg border border-border bg-surface-elevated px-4 text-base text-white placeholder:text-muted/70 outline-none ring-brand-orange focus:ring-2";

type SignInFormProps = {
  onSignedIn: (user: StoredUser) => void;
};

export function SignInForm({ onSignedIn }: SignInFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (!isWorkEmail(trimmedEmail)) {
      setError(`Use your work email ending in @${WORK_EMAIL_DOMAIN}.`);
      return;
    }

    const user = { name: trimmedName, email: trimmedEmail };
    saveUser(user);
    onSignedIn(user);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">One-time sign in</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your name and Airobotics work email. This device will remember
          you so you do not need to sign in again.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">
          Full name <span className="text-brand-orange">*</span>
        </span>
        <input
          required
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">
          Work email <span className="text-brand-orange">*</span>
        </span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`you@${WORK_EMAIL_DOMAIN}`}
          className={fieldClass}
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="min-h-14 w-full rounded-lg bg-brand-orange px-4 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 active:brightness-110"
      >
        Continue
      </button>
    </form>
  );
}
