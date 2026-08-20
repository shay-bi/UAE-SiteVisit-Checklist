# UAE Site Visit / Failure Safety Checklist

Mobile-friendly form for Airobotics employees to submit a safety checklist once per site visit. Each submission is emailed to operations via Resend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root with:

```bash
RESEND_API_KEY=re_your_key_here
REPORT_TO_EMAIL=shaybit@airoboticsdrones.com
```

Get the key from [resend.com/api-keys](https://resend.com/api-keys).

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

## Deploy

Deploy to Vercel and add the same environment variables in the project settings.
