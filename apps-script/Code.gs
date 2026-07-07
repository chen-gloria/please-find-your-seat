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
// Optional: to serve the guest list from a Google Sheet instead of the
// bundled guests.json, put the Sheet ID here (else leave '').
// Sheet must have a header row: name | table
var SHEET_ID = ''
var SHEET_NAME = 'Sheet1'
// ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
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

    return jsonOut({ ok: true, id: file.getId(), name: filename })
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) })
  }
}

/**
 * Optional seat lookup from a Google Sheet.
 *   GET ...?name=Kenneth%20Lo   → { ok, table }
 *   GET ...                     → { ok, guests: [{name, table}, ...] }
 * Only used if you switch the frontend to fetch from here.
 */
function doGet(e) {
  try {
    if (!SHEET_ID) return jsonOut({ ok: false, error: 'No SHEET_ID configured' })
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
    var rows = sheet.getDataRange().getValues()
    var guests = []
    for (var i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue
      guests.push({ name: String(rows[i][0]).trim(), table: String(rows[i][1]).trim() })
    }
    var q = e && e.parameter && e.parameter.name
    if (q) {
      var norm = q.trim().toLowerCase()
      var hit = guests.filter(function (g) {
        return g.name.toLowerCase() === norm
      })[0]
      return jsonOut({ ok: !!hit, table: hit ? hit.table : null })
    }
    return jsonOut({ ok: true, guests: guests })
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) })
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
