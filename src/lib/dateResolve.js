// Deterministic date/time resolution — never done by the model. The parse
// prompts ask the LLM only to echo what the user literally stated
// (stated_date/stated_time), never to compute a final calendar date or
// convert a clock time to UTC. This module does that arithmetic instead.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const STATED_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayInTimezone(timezone, now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (t) => parts.find(p => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDaysToISODate(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  // Anchor at UTC noon so pure calendar-day math never shifts a day due to
  // a local-time DST transition landing near midnight.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// stated_date is either an ISO date, "today", "tomorrow", or a bare weekday
// name — never phrasing like "next thursday" (that nuance is out of scope
// for v1; a bare weekday always means its next occurrence, today included).
function resolveStatedDateToISO(statedDate, timezone, now) {
  if (!statedDate) return null;
  const v = String(statedDate).trim().toLowerCase();
  if (ISO_DATE_RE.test(v)) return v;
  const today = todayInTimezone(timezone, now);
  if (v === 'today') return today;
  if (v === 'tomorrow') return addDaysToISODate(today, 1);
  const targetDow = WEEKDAYS.indexOf(v);
  if (targetDow === -1) return null;
  const [y, m, d] = today.split('-').map(Number);
  const todayDow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  const diff = (targetDow - todayDow + 7) % 7;
  return addDaysToISODate(today, diff);
}

// Converts a local wall-clock date+time in `timezone` to a UTC Date,
// correct across DST — the standard "guess, then correct by the zone's
// actual offset at that instant" technique. Backed by Intl.DateTimeFormat,
// which uses the full IANA tz database built into Node's ICU — no extra
// dependency needed.
function zonedTimeToUtc(dateStr, timeStr, timezone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(utcGuess)).map(p => [p.type, p.value]));
  const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offset = asIfUtc - utcGuess;
  return new Date(utcGuess - offset);
}

// Only produces a fixed_time when BOTH a resolvable date and an explicit
// clock time are present — matching "events without a time get no reminder
// in v1." Returns an ISO UTC string, or null.
export function computeFixedTime({ stated_date, stated_time, timezone, now }) {
  const tz = timezone || 'America/Edmonton';
  const at = now || new Date();
  if (!stated_time || !STATED_TIME_RE.test(String(stated_time).trim())) return null;
  const isoDate = resolveStatedDateToISO(stated_date, tz, at);
  if (!isoDate) return null;
  return zonedTimeToUtc(isoDate, String(stated_time).trim(), tz).toISOString();
}
