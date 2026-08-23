# UAE Site Visit / Failure Safety Checklist

Mobile-friendly form for Airobotics employees to submit a safety checklist once per site visit. Each submission is emailed to operations via Resend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root (see [`.env.example`](.env.example)):

```bash
RESEND_API_KEY=re_your_key_here
REPORT_TO_EMAIL=shaybit@airoboticsdrones.com
ADMIN_EMAIL=shaybit@airoboticsdrones.com
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=long-random-string

# Firebase — paste service account JSON (one line) from Firebase Console
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Get the Resend key from [resend.com/api-keys](https://resend.com/api-keys).

### Firebase setup (Firestore)

Project: **`uae-site-visit-checklist`** ([Firebase console](https://console.firebase.google.com/project/uae-site-visit-checklist/overview))

Firestore is in **`me-central1`** (Middle East).

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) — or use the existing `uae-site-visit-checklist` project.
2. Enable **Firestore** if not already enabled.
3. Go to **Project settings → Service accounts → Generate new private key**.
4. Copy the JSON into `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local` (single line).
5. Deploy Firestore rules and indexes from this repo:

```bash
npx firebase-tools login
npx firebase-tools use uae-site-visit-checklist
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

To verify local credentials:

```bash
node --env-file=.env.local --experimental-strip-types scripts/verify-firebase.mjs
```

Firestore stores:
- **Site visit reports** (admin panel)
- **UAV frequency table** (shared team edits)
- **Submit rate limits** (1 per hour per email)

Without Firebase env vars, the app falls back to local `data/` files (fine for local dev only; not reliable on Vercel).

3. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone (same Wi‑Fi) or desktop.

## Email notes

- Reports go to `REPORT_TO_EMAIL` (default: `shaybit@airoboticsdrones.com`).
- Without a verified domain, Resend sends from `onboarding@resend.dev`. That works for MVP when the recipient matches your Resend account email.
- Later, verify `airoboticsdrones.com` in Resend and set `RESEND_FROM_EMAIL`.

## Sign-in

Employees sign in once with their name and `@airoboticsdrones.com` email. The app stores that on the device (localStorage) so they stay signed in. Use **Switch user** to change accounts on a shared phone.

## Required fields

Site location, every safety checklist item, and additional notes are required. Any new items added in [`src/lib/checklist.ts`](src/lib/checklist.ts) are also required automatically.

## Admin panel

Open [http://localhost:3000/admin](http://localhost:3000/admin).

Only `shaybit@airoboticsdrones.com` can sign in (set via `ADMIN_EMAIL`). Use the password from `ADMIN_PASSWORD` in `.env.local`.

Submitted reports are stored in **Firestore** (when configured) and listed in the admin panel. Email delivery still goes to Outlook as before.

## Deploy

Deploy to Vercel and add the environment variables in the project settings (`RESEND_API_KEY`, `REPORT_TO_EMAIL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`).
