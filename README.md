# Please Find Your Seat

A tiny, zero-database web app for weddings & events. Guests scan a QR code,
type their name, and instantly see their table number highlighted on a simple
floor plan. They can also snap/upload a photo that lands straight in your
shared Google Drive folder.

- **Frontend:** React + Vite (static site) — hosted free on GitHub Pages
- **Backend:** Google Apps Script Web App (runs under your Google account) — no
  database, no API keys, no server to maintain
- **Data:** a plain `guests.json` file (or a Google Sheet, optional)

---

## What YOU need to do (≈15 min)

### 1. Fill in your guest list
Edit [`public/guests.json`](public/guests.json). One entry per guest:

```json
[
  { "name": "Kenneth Lo", "table": "1" },
  { "name": "Emily Wong", "table": "2" }
]
```

`table` values must match the `id`s in the floor plan (see step 2).

### 2. Adjust the floor plan (optional)
Edit [`src/floorplanData.ts`](src/floorplanData.ts) — move the circles, rename
tables, add/remove stage & dance floor. It's just coordinates on a canvas.

### 3. Set up photo upload (optional but recommended)
1. Create the shared Google Drive folder for the photos.
2. Go to [script.google.com](https://script.google.com) → **New project**.
3. Paste in [`apps-script/Code.gs`](apps-script/Code.gs).
4. Put your Drive **folder ID** into `FOLDER_ID` at the top.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web App URL** and paste it into `APPS_SCRIPT_URL` in
   [`src/config.ts`](src/config.ts).

Photos are saved as `GuestName_timestamp.jpg`. If you skip this step the
seat-finder still works; the photo button just won't appear.

### 4. Push your edits
Any push to `main` auto-rebuilds and redeploys (GitHub Actions). To change
seating at the last minute, edit `guests.json` and push — that's it.

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
