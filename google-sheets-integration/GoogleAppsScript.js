/**
 * Google Apps Script for MyAutoSpex Lead Storage (hardened, Nov 2026)
 *
 * Receives lead data from the MyAutoSpex site and appends it to the matching
 * sheet in this workbook.
 *
 * Deploy as a Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * The Web App URL is necessarily public (the site's forms post to it), so this
 * script treats every request as untrusted:
 * - only the site's own sheet names are accepted, and sheets are never created
 *   from request data
 * - field names, field count and value length are capped
 * - values that a spreadsheet would run as a formula (starting with = + - @)
 *   are stored as plain text, so a submitted "=IMPORTXML(...)" can't read or
 *   send other leads' details when the sheet is opened
 * - a global per-minute limit stops someone flooding the sheet
 * - errors return a generic message without internal details
 */

// The sheets the site writes to (utils/leadStorage.ts SHEET_NAME_MAP).
const ALLOWED_SHEETS = [
  'OBD2_Leads',
  'Coupon_Leads',
  'Affordability_Leads',
  'MPG_Leads',
  'Ownership_Leads',
  'Resale_Leads',
  'VIN_Leads',
  'Repair_Leads',
  'Insurance_Leads',
];

const MAX_BODY_CHARS = 20000;   // one lead is far smaller than this
const MAX_FIELDS = 30;          // fields accepted per lead
const MAX_COLUMNS = 40;         // columns a sheet may grow to
const MAX_VALUE_CHARS = 1000;   // characters kept per value
const MAX_LEADS_PER_MINUTE = 30; // across all visitors

function respond(success) {
  return ContentService.createTextOutput(JSON.stringify({ success: success }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Field names: letters, digits, spaces, underscores, dashes, dots; 1-40 characters. */
function isSafeKey(key) {
  return /^[A-Za-z0-9 _.\-]{1,40}$/.test(key) && !/^[=+\-@]/.test(key);
}

/** A value as stored in a cell: numbers and booleans as-is, everything else as capped plain text. */
function safeCell(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  let text = value === undefined || value === null ? '' :
    (typeof value === 'object' ? JSON.stringify(value) : String(value));
  text = text.slice(0, MAX_VALUE_CHARS);
  // A leading apostrophe makes Sheets store the text literally instead of running it.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return text;
}

/** True while this minute's global lead count is under the limit (and counts this one). */
function underRateLimit() {
  const cache = CacheService.getScriptCache();
  const bucket = 'leads-' + Math.floor(Date.now() / 60000);
  const count = Number(cache.get(bucket) || 0);
  if (count >= MAX_LEADS_PER_MINUTE) return false;
  cache.put(bucket, String(count + 1), 120);
  return true;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > MAX_BODY_CHARS) return respond(false);

    const body = JSON.parse(raw);
    const sheetName = body && body.sheetName;
    const lead = body && body.data;
    if (ALLOWED_SHEETS.indexOf(sheetName) === -1) return respond(false);
    if (!lead || typeof lead !== 'object' || Array.isArray(lead)) return respond(false);

    const keys = Object.keys(lead).filter(isSafeKey).slice(0, MAX_FIELDS);
    if (keys.length === 0) return respond(false);

    if (!lock.tryLock(10000)) return respond(false);
    if (!underRateLimit()) return respond(false);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Only the allow-listed names above can reach this point.
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
      sheet.getRange(1, 1, 1, keys.length).setFontWeight('bold');
    }

    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]
      .map(function (h) { return String(h); })
      .filter(function (h) { return h !== ''; });

    // Add columns for new field names, up to the column cap.
    const newHeaders = keys.filter(function (k) { return headers.indexOf(k) === -1; })
      .slice(0, Math.max(0, MAX_COLUMNS - headers.length));
    if (newHeaders.length > 0) {
      sheet.getRange(1, headers.length + 1, 1, newHeaders.length).setValues([newHeaders]);
      Array.prototype.push.apply(headers, newHeaders);
    }

    const row = headers.map(function (h) { return safeCell(lead[h]); });
    sheet.appendRow(row);
    return respond(true);
  } catch (err) {
    console.error('doPost failed: ' + err);
    return respond(false);
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

// Answers GET so the deployment can be checked in a browser. Reveals nothing.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run from the Apps Script editor to test: appends one row to OBD2_Leads.
function testScript() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        sheetName: 'OBD2_Leads',
        data: {
          timestamp: new Date().toISOString(),
          name: 'Test User',
          note: '=IMPORTXML("https://example.com","//a")', // must be stored as text
          source: 'Manual Test',
        },
      }),
    },
  });
  Logger.log(result.getContent());
}
