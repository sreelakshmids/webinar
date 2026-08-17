/**
 * sheets-webhook.gs — Zoho Forms → Google Sheet receiver for the Zeminent
 * webinar funnel. Feeds the Power BI dataset.
 *
 * ── Deployment ────────────────────────────────────────────────────────────
 *  1. Create a Google Sheet. Rename the first tab to "Registrations".
 *  2. Extensions → Apps Script. Replace the default file with this one.
 *  3. Set SHEET_ID (from the sheet URL) and SHARED_SECRET (any long random
 *     string) in the CONFIG block below.
 *  4. Run setupSheet() once and grant the authorisation prompt.
 *  5. Deploy → New deployment → type "Web app".
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     Copy the /exec URL.
 *  6. Zoho Forms → Integrations → Webhooks:
 *       URL:          <your /exec URL>?secret=<SHARED_SECRET>
 *       Method:       POST
 *       Content type: JSON
 *       Fields:       all of them, including the hidden UTM fields.
 *
 * ── After the webinar ─────────────────────────────────────────────────────
 *  Export attendees from Zoho Webinar → Reports. Paste into a tab named
 *  "Attendance" with columns Email and Minutes, then run mergeAttendance().
 *  That is what turns registrations into the attended/no-show split Power BI
 *  reports on.
 *
 * Writes are deduped on (email + webinar), so a retried webhook or a
 * re-submission updates the existing row instead of adding a second one.
 */

// ── CONFIG ────────────────────────────────────────────────────────────────

var CONFIG = {
  // From the sheet URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
  SHEET_ID: 'REPLACE_WITH_SHEET_ID',

  // Any long random string. Must match the ?secret= on the webhook URL.
  // This is the only thing standing between the sheet and an open /exec
  // endpoint, so make it long and don't reuse it elsewhere.
  SHARED_SECRET: 'REPLACE_WITH_LONG_RANDOM_STRING',

  REGISTRATIONS_TAB: 'Registrations',
  ATTENDANCE_TAB: 'Attendance',

  // Stamped on every row so multiple webinars can share one sheet.
  WEBINAR: 'full-stack-roadmap',
};

// Mirrors the live form at
// forms.zohopublic.in/prathyushazemi1/form/WebinarSignupForm — which asks a
// different set of questions from the ones sketched in INTEGRATION-GUIDE.md
// section 1. The form is the source of truth; these columns follow it.
var HEADERS = [
  'Timestamp',
  'Webinar',
  'Full Name',
  'Email',
  'Phone',
  'City',
  'Current Status',
  'Education Criteria',
  'Technologies',
  'Heard From',
  'Wants Updates',
  'Question',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'cta_location',
  'landing_page',
  'referrer',
  'Lead Score',
  'Attended',
  'Attendance Minutes',
];

// ── Web app entry points ──────────────────────────────────────────────────

function doPost(e) {
  try {
    if (!isAuthorised(e)) return jsonResponse({ ok: false, error: 'unauthorised' });

    var payload = parseBody(e);
    if (!payload) return jsonResponse({ ok: false, error: 'empty or unparseable body' });

    var result = upsertRegistration(payload);
    return jsonResponse({ ok: true, action: result.action, row: result.row });
  } catch (err) {
    // Never throw back at Zoho — a 500 makes it retry, and a retry storm on a
    // genuine bug is worse than a logged failure.
    console.error('doPost failed: ' + err);
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// Health check: open the /exec URL in a browser to confirm the deployment is
// live and the secret is right, without sending a fake registration.
function doGet(e) {
  if (!isAuthorised(e)) return jsonResponse({ ok: false, error: 'unauthorised' });
  var sheet = registrationsSheet();
  return jsonResponse({
    ok: true,
    tab: CONFIG.REGISTRATIONS_TAB,
    rows: Math.max(0, sheet.getLastRow() - 1),
  });
}

function isAuthorised(e) {
  var provided = e && e.parameter ? e.parameter.secret : null;
  return !!provided && provided === CONFIG.SHARED_SECRET;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Zoho can post JSON, form-encoded, or JSON wrapped in a form field
 * depending on how the webhook is configured. Accept all three so a
 * mis-set content type doesn't silently drop registrations.
 */
function parseBody(e) {
  if (!e) return null;

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // Not JSON — fall through to the form parameters.
    }
  }

  if (e.parameter && Object.keys(e.parameter).length > 1) {
    var params = {};
    for (var key in e.parameter) {
      if (key !== 'secret') params[key] = e.parameter[key];
    }
    return params;
  }

  return null;
}

// ── Sheet setup ───────────────────────────────────────────────────────────

function setupSheet() {
  var book = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = book.getSheetByName(CONFIG.REGISTRATIONS_TAB);
  if (!sheet) sheet = book.insertSheet(CONFIG.REGISTRATIONS_TAB);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);

  if (!book.getSheetByName(CONFIG.ATTENDANCE_TAB)) {
    var attendance = book.insertSheet(CONFIG.ATTENDANCE_TAB);
    attendance.getRange(1, 1, 1, 2).setValues([['Email', 'Minutes']]);
    attendance.getRange(1, 1, 1, 2).setFontWeight('bold');
    attendance.setFrozenRows(1);
  }

  return 'Ready — ' + HEADERS.length + ' columns on "' + CONFIG.REGISTRATIONS_TAB + '"';
}

function registrationsSheet() {
  var book = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = book.getSheetByName(CONFIG.REGISTRATIONS_TAB);
  if (!sheet) throw new Error('Tab "' + CONFIG.REGISTRATIONS_TAB + '" not found. Run setupSheet() first.');
  return sheet;
}

// ── Write path ────────────────────────────────────────────────────────────

/**
 * Insert or update a registration, keyed on lowercased email + webinar.
 *
 * The whole thing runs inside a script lock: two webhook deliveries landing
 * in the same second would otherwise both read "no existing row" and both
 * append, which is exactly the duplicate this is meant to prevent.
 */
function upsertRegistration(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = registrationsSheet();
    var record = normalise(payload);
    var rowValues = HEADERS.map(function (header) {
      return record[header] !== undefined ? record[header] : '';
    });

    var existingRow = findRow(sheet, record.Email, record.Webinar);
    if (existingRow > 0) {
      // Preserve attendance — it is merged in after the session and must not
      // be wiped by a late re-submission.
      var current = sheet.getRange(existingRow, 1, 1, HEADERS.length).getValues()[0];
      var attendedIdx = HEADERS.indexOf('Attended');
      var minutesIdx = HEADERS.indexOf('Attendance Minutes');
      rowValues[attendedIdx] = current[attendedIdx] || rowValues[attendedIdx];
      rowValues[minutesIdx] = current[minutesIdx] || rowValues[minutesIdx];

      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([rowValues]);
      return { action: 'updated', row: existingRow };
    }

    sheet.appendRow(rowValues);
    return { action: 'inserted', row: sheet.getLastRow() };
  } finally {
    lock.releaseLock();
  }
}

function findRow(sheet, email, webinar) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var emailCol = HEADERS.indexOf('Email') + 1;
  var webinarCol = HEADERS.indexOf('Webinar') + 1;
  var emails = sheet.getRange(2, emailCol, lastRow - 1, 1).getValues();
  var webinars = sheet.getRange(2, webinarCol, lastRow - 1, 1).getValues();

  for (var i = 0; i < emails.length; i++) {
    if (
      String(emails[i][0]).trim().toLowerCase() === email &&
      String(webinars[i][0]).trim() === webinar
    ) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Map Zoho's field names onto our column headers.
 *
 * Zoho sends whatever the form calls the field, and the exact key varies with
 * the form's internal naming (spaces, underscores, "SingleLine1"). Each entry
 * below lists the aliases seen in practice, most specific first.
 */
var FIELD_ALIASES = {
  'Full Name': ['Name', 'Full Name', 'Full_Name', 'fullName', 'SingleLine'],
  Email: ['Email Address', 'Email_Address', 'Email', 'email'],
  Phone: ['Phone', 'phone', 'PhoneNumber', 'Phone_Number'],
  City: ['City', 'city'],
  'Current Status': ['Current Status', 'Current_Status', 'currentStatus'],
  'Education Criteria': ['Education Criteria', 'Education_Criteria'],
  Technologies: [
    'Which of these technologies have you used/worked on?',
    'Which_of_these_technologies_have_you_used_worked_on',
    'Technologies',
    'MultipleChoice',
  ],
  'Heard From': [
    'How did you hear about this webinar?',
    'How_did_you_hear_about_this_webinar',
    'Heard From',
  ],
  'Wants Updates': [
    'Would you be interested in receiving future updates from us?',
    'Would_you_be_interested_in_receiving_future_updates_from_us',
    'Wants Updates',
  ],
  Question: [
    'Any questions that needs to be addressed during the webinar?',
    'Any_questions_that_needs_to_be_addressed_during_the_webinar',
    'Question',
    'MultiLine',
  ],
  utm_source: ['utm_source'],
  utm_medium: ['utm_medium'],
  utm_campaign: ['utm_campaign'],
  utm_content: ['utm_content'],
  utm_term: ['utm_term'],
  gclid: ['gclid'],
  fbclid: ['fbclid'],
  cta_location: ['cta_location'],
  landing_page: ['landing_page'],
  referrer: ['referrer'],
};

function pick(payload, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var value = payload[aliases[i]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      // Multi-choice answers arrive as an array; keep them comma-separated so
      // the cell stays readable and Power BI can split on it.
      if (Object.prototype.toString.call(value) === '[object Array]') {
        return value.filter(Boolean).join(', ');
      }
      // Composite fields (name, address) arrive as objects.
      if (typeof value === 'object') {
        return Object.keys(value)
          .map(function (k) {
            return value[k];
          })
          .filter(Boolean)
          .join(' ')
          .trim();
      }
      return String(value).trim();
    }
  }
  return '';
}

function normalise(payload) {
  var record = { Timestamp: new Date(), Webinar: CONFIG.WEBINAR };

  for (var header in FIELD_ALIASES) {
    record[header] = pick(payload, FIELD_ALIASES[header]);
  }

  record.Email = String(record.Email).toLowerCase();
  record['Lead Score'] = scoreLead(record);
  record.Attended = 'No';
  record['Attendance Minutes'] = 0;

  return record;
}

// ── Lead scoring ──────────────────────────────────────────────────────────

/**
 * 0–100 intent score, written on every row so Power BI and the CRM workflow
 * rules can filter on it.
 *
 * The weights below are guesses. They are deliberately simple and grouped so
 * they are easy to re-tune once there is real conversion data to fit them
 * against — do not read them as a validated model.
 */
function scoreLead(record) {
  var score = 0;

  // Where they are in their journey — the strongest signal available at
  // registration time. Values are the four options on the live form.
  var status = String(record['Current Status']).toLowerCase();
  if (status.indexOf('job seeking') !== -1) score += 30;
  else if (status.indexOf('career break') !== -1) score += 26;
  else if (status.indexOf('still studying') !== -1) score += 20;
  else if (status.indexOf('working') !== -1) score += 16;

  // Existing ability, proxied by how many of the four listed technologies
  // they've touched. Someone with none can still follow the roadmap; someone
  // with two or three can act on it immediately.
  var techCount = String(record.Technologies)
    .split(',')
    .filter(function (t) {
      return t.trim();
    }).length;
  if (techCount >= 3) score += 20;
  else if (techCount === 2) score += 15;
  else if (techCount === 1) score += 9;

  // Contactability and engagement.
  if (record.Phone) score += 10;
  if (record.City) score += 4;
  if (record.Question) score += 6;
  if (String(record['Wants Updates']).toLowerCase().indexOf('yes') !== -1) score += 6;

  // Channel. Paid and referral traffic converts differently from organic;
  // this is the crudest part of the model.
  var source = String(record.utm_source).toLowerCase();
  if (source === 'referral' || source === 'friend') score += 12;
  else if (record.gclid || source === 'google') score += 10;
  else if (source === 'linkedin') score += 8;
  else if (record.fbclid || source === 'instagram' || source === 'facebook') score += 6;
  else if (source) score += 4;

  // Intent shown by which CTA they used — someone who read to the bottom of
  // the page before registering is further along than a top-bar click.
  var cta = String(record.cta_location).toLowerCase();
  if (cta === 'final_cta') score += 10;
  else if (cta === 'session_card' || cta === 'seat_bar') score += 7;
  else if (cta) score += 4;

  return Math.max(0, Math.min(100, score));
}

// ── Post-webinar merge ────────────────────────────────────────────────────

/**
 * Fold the Zoho Webinar attendee export into the registrations table.
 *
 * Expects an "Attendance" tab with Email and Minutes columns. Everyone in
 * Registrations who is not in that export is marked "No" — the no-show side
 * of the split matters as much as the attended side, and leaving it blank
 * makes show-up rate uncomputable.
 */
function mergeAttendance() {
  var book = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var attendanceSheet = book.getSheetByName(CONFIG.ATTENDANCE_TAB);
  if (!attendanceSheet) throw new Error('Tab "' + CONFIG.ATTENDANCE_TAB + '" not found.');

  var lastAttendanceRow = attendanceSheet.getLastRow();
  var minutesByEmail = {};
  if (lastAttendanceRow >= 2) {
    var rows = attendanceSheet.getRange(2, 1, lastAttendanceRow - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      var email = String(rows[i][0]).trim().toLowerCase();
      if (!email) continue;
      var minutes = Number(rows[i][1]) || 0;
      // Zoho emits one row per join, so someone who reconnects appears twice.
      minutesByEmail[email] = (minutesByEmail[email] || 0) + minutes;
    }
  }

  var sheet = registrationsSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'No registrations to merge into.';

  var emailCol = HEADERS.indexOf('Email') + 1;
  var attendedCol = HEADERS.indexOf('Attended') + 1;
  var emails = sheet.getRange(2, emailCol, lastRow - 1, 1).getValues();

  var updates = [];
  var matched = 0;
  for (var r = 0; r < emails.length; r++) {
    var key = String(emails[r][0]).trim().toLowerCase();
    var mins = minutesByEmail[key];
    if (mins !== undefined) {
      matched++;
      updates.push(['Yes', mins]);
    } else {
      updates.push(['No', 0]);
    }
  }

  // One ranged write rather than a write per row — a per-row setValue on a
  // few thousand registrations will hit the Apps Script execution limit.
  sheet.getRange(2, attendedCol, updates.length, 2).setValues(updates);

  return (
    'Merged ' + matched + ' attendees across ' + updates.length + ' registrations.'
  );
}
