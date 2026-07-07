// ─────────────────────────────────────────────────────────────
//  CONFIG — the only file you normally need to touch.
// ─────────────────────────────────────────────────────────────

// Paste your Google Apps Script Web App URL here after you deploy it
// (see /apps-script/Code.gs and the README). Used for BOTH photo upload and
// (when GUEST_LOOKUP is 'sheet') the seat lookup.
export const APPS_SCRIPT_URL = ''

// Where guest names live:
//   'sheet' → looked up live from your private Google Sheet via Apps Script.
//             Real guest names never touch this public repo. (Needs
//             APPS_SCRIPT_URL set + SHEET_ID filled in Code.gs.)
//   'local' → read from the bundled public/guests.json (fine for a demo, but
//             those names would be public in this repo).
export const GUEST_LOOKUP: 'sheet' | 'local' = 'local'

// Names shown on the welcome screen. Purely cosmetic.
export const EVENT_TITLE = 'Please Find Your Seat'
export const COUPLE_NAMES = '' // e.g. 'Kenneth & Gloria' — shown under the title, optional

// Max pixel dimension photos are resized to before upload (keeps uploads fast).
export const PHOTO_MAX_DIMENSION = 1600
