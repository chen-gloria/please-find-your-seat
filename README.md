# Please Find Your Seat

A tiny, zero-database web app for weddings & events. Guests scan a QR code,
type their name, and instantly see their table number highlighted on a simple
floor plan. They can also snap/upload a photo that lands straight in your
shared Google Drive folder.

- **Frontend:** React + Vite (static site) — hosted free on GitHub Pages
- **Backend:** Google Apps Script Web App (runs under your Google account) — no
  database, no API keys, no server to maintain
- **Data:** a private Google Sheet (guest names never live in this repo)

> **Privacy note:** this repo is public (so free GitHub Pages works), but your
> guest list lives in a private Google Sheet. The app looks names up one at a
> time through Apps Script and only ever returns *that one guest's* table —
> the full roster is never exposed.

---

## What YOU need to do (≈15 min)

### 1. Put your guest list in a Google Sheet
1. Create a new Google Sheet.
2. Row 1 headers: `name` in A1, `table` in B1.
3. One guest per row, e.g. `Kenneth Lo | 1`. `table` values must match the
   floor-plan `id`s (see step 2).
4. The Sheet **ID** is in its URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

You'll wire this up in step 3. To change seating at the last minute, just edit
the Sheet — no redeploy needed.

### 2. Adjust the floor plan (optional)
Edit [`src/floorplanData.ts`](src/floorplanData.ts) — move the circles, rename
tables, add/remove stage & dance floor. It's just coordinates on a canvas.

### 3. Deploy the Apps Script (handles both lookup + photos)
1. Create the shared Google Drive folder for the photos.
2. Go to [script.google.com](https://script.google.com) → **New project**.
3. Paste in [`apps-script/Code.gs`](apps-script/Code.gs).
4. At the top fill in:
   - `FOLDER_ID` — your Drive folder ID (for photos)
   - `SHEET_ID` — your guest-list Sheet ID from step 1
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web App URL** and paste it into `src/config.ts`:
   - `APPS_SCRIPT_URL = '...your url...'`
   - `GUEST_LOOKUP = 'sheet'`  ← switches lookups to the Sheet

Photos are saved as `GuestName_timestamp.jpg`. If you skip the Drive part the
seat-finder still works; the photo button just won't appear.

> Re-deploy note: after editing `Code.gs` you must **Manage deployments → edit →
> Version: New version** for changes to take effect at the same URL.

### 4. Push your config change
Commit `src/config.ts` and push to `main` — GitHub Actions rebuilds and
redeploys automatically. (Editing the Sheet does **not** need a redeploy.)

### 5. Make the QR code
Point a QR generator at your live URL:
`https://chen-gloria.github.io/please-find-your-seat/`

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/please-find-your-seat/
```

## How "login" works
The matched guest is cached in `localStorage`, so returning visitors skip
straight to their table. A **"Not you? Switch guest"** link clears it (handy
when a couple shares one phone).

## Notes
- Names are matched tolerantly: exact first, then a unique prefix/substring
  (so "kenneth" finds "Kenneth Lo" if unique). Ambiguous input asks for the
  full name.
- Photos are downscaled in the browser before upload to keep things fast.
- **Custom domain?** Change `base` in `vite.config.ts` to `'/'`.
