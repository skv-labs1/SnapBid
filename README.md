# SnapBid

Mobile-first quoting app for small contractors in Ontario. Take site photos
and dictate a voice note on your phone; SnapBid drafts an itemized estimate
you can review, edit, brand, and save as a PDF.

- Next.js 15 (App Router, TypeScript, Tailwind), single page at `/`
- One API route (`/api/quote`) calls the Gemini API server-side
- No database, no accounts — settings and quote history live in your
  browser's localStorage
- "Save as PDF" is the browser's print dialog with print-tuned CSS

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key, server-only. Never exposed to the client. |
| `GEMINI_MODEL` | Model name, default `gemini-3-flash`. Flash only — Pro models are not on the free tier. |
| `APP_PASSWORD` | Shared password the app asks for once per device. |

### Getting a Gemini key

1. Go to [Google AI Studio](https://aistudio.google.com/) and sign in.
2. Create an API key on a project with **billing OFF** — enabling billing
   removes the free tier.
3. Put the key in `GEMINI_API_KEY`.

> **Privacy warning:** the Gemini free tier may use submitted data for
> training. Demo with **fake customer names and addresses only**. Don't
> upload photos or notes you wouldn't want retained.

### About the password

`APP_PASSWORD` is a cost and quota guard, not real security. It stops
strangers who find the URL from burning your free-tier quota. It is stored
in the browser's localStorage and sent as a header; anyone you give it to
can use your quota.

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New Project** → import the repo. Next.js is detected
   automatically.
3. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY`,
   `GEMINI_MODEL`, and `APP_PASSWORD`.
4. Deploy. Open the URL on your phone, enter the password once, and
   optionally use the browser menu's "Add to Home Screen" for an app icon.

## Notes

- Photos are resized in the browser (max 1280 px, JPEG) before upload to
  stay under Vercel's 4.5 MB request limit.
- Voice capture uses the Web Speech API (Chrome on Android, Safari on iOS).
  Where unavailable, use the keyboard's mic to dictate into the text box.
- On a 429 from Gemini the app tells you to wait a minute; it never
  auto-retries.
