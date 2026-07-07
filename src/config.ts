// ─────────────────────────────────────────────────────────────
//  CONFIG — the only file you normally need to touch.
// ─────────────────────────────────────────────────────────────

// Paste your Google Apps Script Web App URL here after you deploy it
// (see /apps-script/Code.gs and the README). Leave "" to disable photo
// upload — the seat-finder still works without it.
export const APPS_SCRIPT_URL = ''

// Names shown on the welcome screen. Purely cosmetic.
export const EVENT_TITLE = 'Please Find Your Seat'
export const COUPLE_NAMES = '' // e.g. 'Kenneth & Gloria' — shown under the title, optional

// Max pixel dimension photos are resized to before upload (keeps uploads fast).
export const PHOTO_MAX_DIMENSION = 1600
