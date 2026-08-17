# Daily — Season Tracker

A mobile-first, single-user tracker for a 6-track self-improvement season (Aug–Dec 2026):
**CJCA, Gym, Italian, Chinese (optional), Cardio (Run / Ride / Swim, ad-hoc), and the 5 daily prayers.**

- **Sessions** are auto-generated each day from a fixed weekly schedule (Gym / CJCA / Italian, plus optional Chinese). Check one off and log the actual minutes.
- **Cardio** is ad-hoc: tap `+ Run`, `+ Ride`, or `+ Swim` any time to log distance (km) + duration. Multiple per day, editable and deletable.
- **Prayers**: five one-tap toggles with a recorded timestamp.
- **Analytics**: weekly hours logged vs. planned, cardio distance/time, per-track streaks (current + longest, with broken-streak notes), 7/30-day completion, season totals against targets (Italian ~350h, Chinese ~140h, CJCA ~10h/wk), and a monthly prayer heatmap.

## Stack

- `index.html` — the whole app (vanilla JS, no build step)
- `api/` — Vercel serverless functions (`day`, `days`, `settings`)
- `lib/` — shared storage + HTTP helpers
- Persistence — **Vercel Blob** (free tier). The whole dataset lives in a single JSON
  document, `tracker/data.json` (`{ days: { "YYYY-MM-DD": … }, settings: … }`), read on
  load and read-modify-written on save.

The frontend also **writes through to `localStorage`**, so the app works immediately even before you attach a store — it just won't sync across devices until Blob is connected.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel (**Add New → Project**), or run `npx vercel`. No framework preset needed — Vercel serves `index.html` statically and deploys `api/*` as functions.
2. In the project, open **Storage → Create Database → Blob → Connect**. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically — no code changes needed. (Blob has a free tier; no card required.)
3. **Redeploy** so the functions pick up the new env var.
4. Open the deployment on your phone. In **Analytics**, the top line reads *“Synced to Vercel Blob”* once the store is live (or *“No storage attached — this device only”* until then).

> Note: the data document is stored with public-read access, so its (unguessable, random-subdomain) URL is technically reachable by anyone who has it. For a personal habit tracker that's normally fine; if you'd rather it not be public at all, tell me and I'll switch to per-request private downloads.

## Access code (PIN)

The app opens to a lock screen and every API request must carry the correct code —
the server rejects wrong/missing codes with `401`, so the data isn't reachable through
the app without it. The code is read from the **`APP_PIN`** environment variable and
defaults to **`200467`** if unset. Once entered, it's remembered on the device.

**If this repository is public**, the default `200467` is visible in the committed
source (`lib/http.js`). To keep a real secret, do one of:

- **Make the repo private** (recommended for personal use), or
- Set `APP_PIN` to a different value in **Vercel → Project → Settings → Environment
  Variables**, then redeploy. The env value overrides the default.

## Search engines

The app asks not to be indexed via a `noindex` `<meta>` tag, an `X-Robots-Tag`
response header (`vercel.json`), and `robots.txt` (`Disallow: /`).

## Local development

```bash
npm install
npx vercel dev          # runs functions + static site at http://localhost:3000
```

For real persistence locally, copy `.env.example` to `.env.local` and fill in your
`BLOB_READ_WRITE_TOKEN` (from the Blob store's **.env.local** tab in Vercel). Without it,
the API falls back to per-request in-memory storage and the browser relies on `localStorage`.

## Editing the schedule

The weekly plan lives in the `SCHED` object near the top of the `<script>` in `index.html`
(keyed by weekday, `0`=Sunday). Each entry is `[track, name, plannedMinutes, optional]`.
