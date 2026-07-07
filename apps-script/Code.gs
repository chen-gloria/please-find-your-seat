/**
 * Please Find Your Seat — Google Apps Script backend
 * ---------------------------------------------------
 * Runs under YOUR Google account. No API keys, no OAuth flow, no database.
 * Receives photos from the website and drops them into a shared Drive folder.
 *
 * SETUP (one time):
 *   1. Create (or open) the shared Google Drive folder for the photos.
 *   2. Open its URL — the folder ID is the long string after /folders/ :
 *        https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID
 *   3. Paste it into FOLDER_ID below.
 *   4. In script.google.com: New project → paste this file.
 *   5. Deploy → New deployment → type "Web app"
 *        · Execute as:  Me
 *        · Who has access:  Anyone
 *   6. Copy the Web App URL → paste into src/config.ts (APPS_SCRIPT_URL).
 *
 * Re-deploy note: after editing this script you must "Manage deployments →
 * edit → Version: New version" for changes to take effect at the same URL.
 */

// ── EDIT THIS ──────────────────────────────────────────────
var FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID_HERE'
// Guest list Google Sheet: put the Sheet ID from its URL here
//   https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit
var SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE'
// The exact TAB name that holds the name | table columns.
var SHEET_NAME = 'Guest Name for the App'
// ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    if (data.action === 'saveLayout') return saveLayout(data)
    return savePhoto(data)
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) })
  }
}

function savePhoto(data) {
  var folder = DriveApp.getFolderById(FOLDER_ID)
  var mimeType = data.mimeType || 'image/jpeg'
  var ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  var safeName = String(data.guestName || 'guest')
    .replace(/[^\w\-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  var filename = safeName + '_' + Date.now() + '.' + ext

  var bytes = Utilities.base64Decode(data.imageBase64)
  var blob = Utilities.newBlob(bytes, mimeType, filename)
  var file = folder.createFile(blob)

  // Make it viewable by link so the gallery's CDN thumbnail URLs load.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  } catch (e) {
    /* org policy may block link sharing; upload still succeeds */
  }
  // Bust the gallery cache so the new photo shows up promptly.
  CacheService.getScriptCache().remove('photos')

  return jsonOut({ ok: true, id: file.getId(), name: filename })
}

// List image files in the folder (id + name), newest first. Cached 30s so a
// busy photo wall doesn't re-scan Drive on every refresh.
// Gated: when a guest sheet is configured, the caller must pass a name that
// exists in it — so only guests who found their seat can load the wall.
function listPhotos(name) {
  if (SHEET_ID) {
    if (!name || matchGuest(name, readGuests(), true) === null) {
      return jsonOut({ ok: false, error: 'unauthorized' })
    }
  }

  var cache = CacheService.getScriptCache()
  var hit = cache.get('photos')
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON)

  var it = DriveApp.getFolderById(FOLDER_ID).getFiles()
  var arr = []
  while (it.hasNext()) {
    var f = it.next()
    if (String(f.getMimeType()).indexOf('image/') !== 0) continue
    arr.push({ id: f.getId(), name: f.getName(), t: f.getDateCreated().getTime() })
    if (arr.length >= 1000) break
  }
  arr.sort(function (a, b) { return b.t - a.t })

  var out = JSON.stringify({ ok: true, photos: arr })
  cache.put('photos', out, 30)
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON)
}

/**
 * Admin-only: save the floor-plan layout. Password is checked against a
 * Script Property (never stored in this repo). Set it once in the Apps Script
 * editor: Project Settings → Script Properties → ADMIN_PASSWORD = your-password
 */
function saveLayout(data) {
  var props = PropertiesService.getScriptProperties()
  var expected = props.getProperty('ADMIN_PASSWORD')
  if (!expected)
    return jsonOut({ ok: false, error: 'ADMIN_PASSWORD not set in Script Properties' })
  if (String(data.password || '') !== expected)
    return jsonOut({ ok: false, error: 'Wrong password' })
  props.setProperty('LAYOUT_JSON', JSON.stringify(data.layout || {}))
  return jsonOut({ ok: true })
}

/**
 * Seat lookup from a Google Sheet — keeps guest names OUT of the public repo.
 *   GET ...?name=Kenneth%20Lo   → { ok:true, name, table }
 *                               → { ok:false, ambiguous:true }  (type full name)
 *                               → { ok:false, notFound:true }
 * For privacy we NEVER return the full roster — only the single match for the
 * name that was typed.
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {}

    // Serve the floor-plan layout published from the admin page.
    if (params.layout) {
      var raw = PropertiesService.getScriptProperties().getProperty('LAYOUT_JSON')
      return jsonOut({ ok: !!raw, layout: raw ? JSON.parse(raw) : null })
    }

    // List photos for the gallery (only for a valid guest name).
    if (params.photos) return listPhotos(params.name)

    if (!SHEET_ID) return jsonOut({ ok: false, error: 'No SHEET_ID configured' })
    var name = params.name
    if (!name) return jsonOut({ ok: true, ready: true }) // health check, no data leaked

    var guests = readGuests()
    var res = matchGuest(name, guests, params.exact)
    if (res === 'ambiguous') return jsonOut({ ok: false, ambiguous: true })
    if (!res) return jsonOut({ ok: false, notFound: true })
    return jsonOut({ ok: true, name: res.name, table: res.table })
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) })
  }
}

function readGuests() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
  var rows = sheet.getDataRange().getValues()
  var guests = []
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue
    guests.push({
      name: String(rows[i][0]).trim(),
      table: String(rows[i][1]).trim(),
    })
  }
  return guests
}

// Exact match, then (unless exactOnly) unique prefix → unique substring.
function matchGuest(query, guests, exactOnly) {
  var q = String(query).trim().toLowerCase().replace(/\s+/g, ' ')
  if (!q) return null
  var norm = function (g) {
    return g.name.toLowerCase().replace(/\s+/g, ' ')
  }

  var exact = guests.filter(function (g) { return norm(g) === q })
  if (exact.length) return exact[0]
  if (exactOnly) return null

  var prefix = guests.filter(function (g) { return norm(g).indexOf(q) === 0 })
  if (prefix.length === 1) return prefix[0]
  if (prefix.length > 1) return 'ambiguous'

  var incl = guests.filter(function (g) { return norm(g).indexOf(q) !== -1 })
  if (incl.length === 1) return incl[0]
  if (incl.length > 1) return 'ambiguous'

  return null
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
