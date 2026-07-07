// ─────────────────────────────────────────────────────────────
//  CONFIG — the only file you normally need to touch.
// ─────────────────────────────────────────────────────────────

// Paste your Google Apps Script Web App URL here after you deploy it
// (see /apps-script/Code.gs and the README). Used for BOTH photo upload and
// (when GUEST_LOOKUP is 'sheet') the seat lookup.
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyQSdU_jr9jF1h-OnMkLe2H4GZoTmHIIYjhwSYqnUCixdoWHV-tFx6IOVxJSda_-CMo0w/exec'

// Where guest names live:
//   'auto'  → use your Google Sheet as soon as APPS_SCRIPT_URL is set,
//             otherwise fall back to the bundled demo list. (Recommended —
//             just paste the URL above and you're done.)
//   'sheet' → always use the Sheet (via Apps Script).
//   'local' → always use the bundled public/guests.json demo list.
export const GUEST_LOOKUP: 'auto' | 'sheet' | 'local' = 'auto'

// Names shown on the welcome screen. Purely cosmetic.
export const EVENT_TITLE = 'Please Find Your Seat'
export const COUPLE_NAMES = '' // e.g. 'Kenneth & Gloria' — shown under the title, optional

// Max pixel dimension photos are resized to before upload (keeps uploads fast).
export const PHOTO_MAX_DIMENSION = 1600

// Show guests a "View the photo wall" link on their table screen (opens the
// #gallery page). Set false to keep the gallery private/unlinked.
export const SHOW_GALLERY = true
