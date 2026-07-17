// Shared parse/prompt plumbing — used by Sprekta.jsx (Plan/Today/onboarding)
// and Capture.jsx. Extracted so both surfaces call the model and persist
// items/questions identically instead of drifting apart.
import { supabase } from './supabaseClient.js';
import { getDeviceId, getUserTimezone } from './device.js';
import { computeFixedTime } from './dateResolve.js';

export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYMD = () => ymd(new Date());
export const addDays = (n) => ymd(new Date(Date.now() + n * 86400000));
export const nowStr = () => new Date().toString();
export const uid = () => Math.random().toString(36).slice(2);

export function extractText(d) { return (d && Array.isArray(d.content)) ? d.content.filter(b => b.type === 'text').map(b => b.text).join('\n') : ''; }
export function splitReplyAndJSON(text) {
  const f = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { let d = null; try { d = JSON.parse(f[1].trim()); } catch {} return { visible: text.replace(f[0], '').trim(), data: d }; }
  return { visible: text.trim(), data: null };
}
export function grabJSON(text) {
  let t = text.trim();
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) t = f[1].trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}'); if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}
export async function callClaude({ system, messages, accessToken }) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 6000, system, messages }),
  });
  return extractText(await res.json());
}

// Maps each onboarding "wish" key to a planner directive — preferences the
// system leans toward, never hard-gated behavior. See onboarding handoff §5.
const WISH_HINTS = {
  clear: 'They want to just dump and have it sorted — minimize follow-up questions, parse aggressively.',
  big: 'When a large multi-step item appears, break it into a short sequence of dated steps.',
  remember: 'Proactively surface small things at the right time — treat deadlines and small tasks as worth a gentle nudge, not just a list entry.',
  room: 'Defend their "protect" goals even on weeks they do not mention them — do not let them get silently dropped.',
  protectwork: 'Reserve real, uninterrupted deep-work blocks; avoid fragmenting focus time into small pieces.',
  reverse: 'For deadline-driven items, schedule backward from the deadline, sequencing prep steps in dependency order.',
};
function wishContext(wishes) {
  if (!wishes || !wishes.length) return '';
  const lines = wishes.map(k => WISH_HINTS[k]).filter(Boolean);
  return lines.length ? `\nWhat they explicitly asked for:\n${lines.map(l => '- ' + l).join('\n')}` : '';
}

export function profileContext(p) {
  const d = p.defaults;
  return `WHAT YOU ALREADY KNOW — never ask about anything covered here:
Rhythm:
${p.rhythm.filter(Boolean).map(r => '- ' + r).join('\n')}
Defaults: call ${d.call}m, errand ${d.errand}m, deep block ${d.deepBlock}m.
Learned:
${p.learned.filter(Boolean).length ? p.learned.filter(Boolean).map(l => '- ' + l).join('\n') : '- (none yet)'}
Life facts (use these to connect the dots — people, dates, what matters):
${(p.facts || []).filter(Boolean).length ? (p.facts || []).filter(Boolean).map(f => '- ' + f).join('\n') : '- (none)'}
${(p.priorities || []).length ? 'Priority order — protect the top when the week is tight: ' + (p.priorities || []).join(' > ') : ''}
${(p.situations || []).length ? 'Right now — bend the plan to these:\n' + (p.situations || []).filter(s => s.raw).map(s => `- ${s.raw} [${s.scope}]`).join('\n') : ''}
${(p.challenge || '').trim() ? 'Their #1 planning pain, in their own words — actively address this: ' + p.challenge.trim() : ''}${wishContext(p.wishes)}`;
}
export function projectMap(projects) {
  const known = Object.entries(projects).map(([k, v]) => `- ${k}: ${v.label}`).join('\n');
  return `PROJECTS — tag every item with the best-fit key:
${known}
Prefer a SPECIFIC project over the "personal" catch-all whenever two or more items share a real theme (a wedding, a trip, a launch). If a real theme has no bucket yet, invent a short lowercase key. Don't scatter related things into "personal".`;
}

export const ITEM_FIELDS = `"title" (belief-first, plain language — for a plain, already-clear capture, keep it near-verbatim: clean up grammar/capitalization only, e.g. "call pastor kevin" → "Call Pastor Kevin", NEVER add a reason, detail, person, or purpose the user didn't say — "about the ceremony" is invented, not read; for a genuinely vague capture use a short keyword-pull title like "Grandma · flowers · church", never invent scope or a fake specific task), "kind":"task|event|errand", "minutes":number, "deadline":"YYYY-MM-DD"|null, "energy":"deep|admin|physical", "priority":"high|med|low", "suggested_slot": short placement from their rhythm, "project": a project key, "today": boolean, "why": one short warm line — ONLY when today is true, "stated_date": ONLY if they named a specific day for this item — either an absolute "YYYY-MM-DD" if they gave a real date, or the literal token "today"/"tomorrow"/one of monday..sunday if they said a relative day name. Do NOT compute which calendar date a weekday resolves to yourself — just echo the token you heard; the app resolves it deterministically. null if no day was named. "stated_time": ONLY if they stated an explicit clock time, as 24h "HH:MM" (e.g. "2pm" → "14:00"). Never infer a time from a vague part-of-day ("afternoon"/"evening"/"morning" alone) — that stays null, not a guess. "source": the exact verbatim substring of the dump this item came from`;

export const FOCUS_RULES = `Choosing "today" — be an editor, not a list: keep it SMALL (2–4). Include hard anchors (due today / fixed time today). PROTECT one goal-advancing item (usually a Sprekta block) even when nothing forces it. Importance ≠ urgency.
Voice: calm, warm, short. NEVER shame or alarm. Late things are a gentle choice, never a failure.`;

// The vague-capture ladder + typed questions contract (Activity handoff
// Phase C, verbatim intent). Shared by every parse path so "questions" are
// always shaped the same way regardless of which surface triggered the parse.
export const QUESTION_RULES = `QUESTIONS — replace vague "ask" strings with typed question objects:
{ "text", "why", "kind": "fact|profile_person|profile_project", "tier": 1|2|3, "item_ref": index into items[] this belongs to, or null }
The vague-capture ladder (tier rules, verbatim intent):
- Tier 1 — exactly one missing fact: the question IS the row title ("What time is the dentist Thursday?"). why is empty or omitted.
- Tier 2 — two specific questions: text is the first question, why is "that and one more" (resolution happens in a full chat, not inline).
- Tier 3 — genuinely vague: text is "«item» — catch me up?" (use the item's actual title), why is "a line or two is plenty". Never "tell me more".
Vague-verb rule: captures whose verb is figure out / sort out / deal with / handle skip being sweep-eligible (do not set today=true) and become a tier-2 or tier-3 question immediately — still create the item (honest keyword-pull title), just also attach the question.
Profile questions: propose AT MOST ONE per dump, only when it would change scheduling — a repeated person → kind "profile_person" ("Who's X?"), a repeated theme → kind "profile_project" ("Start a Y project?"). item_ref is null for profile questions. Never repeat a question already asked (see ALREADY ASKED below) or something already in Life facts.`;

// Shared by the regular "Sort it" offload, Capture, and onboarding's first
// dump (the "tomorrow" field) so every entry point goes through identical
// parse behavior.
export function offloadSystemPrompt(profile, projects, { askedQuestions = [] } = {}) {
  return `You are Sprekta — a sharp, calm second brain. You don't transcribe a dump; you READ it. Before listing anything, notice what these have in common, which one is the real anchor (most time-critical), what depends on what, and what the person hasn't said but would care about.

${profileContext(profile)}

${projectMap(projects)}

${askedQuestions.length ? 'ALREADY ASKED — never repeat these:\n' + askedQuestions.map(q => '- ' + q).join('\n') + '\n' : ''}
Return ONLY JSON — no prose, no fences:
{
  "read": "1–2 warm, specific sentences of genuine insight — the thread connecting these, the anchor, or a dependency/stake worth naming. NOT a summary of the list. Empty string only if there is truly nothing to add.",
  "items": [ { ${ITEM_FIELDS} } ],
  "questions": [ { ...typed question objects, usually empty... } ]
}

${QUESTION_RULES}

Think, don't transcribe:
- The user's words are sacred: never invent a reason, detail, or piece of context they didn't state, in a title OR anywhere else. "Read" the dump for structure (grouping, sequencing, energy, priority) — that's organizing, not fabricating facts. If you don't know why, don't guess why.
- Group by real project. Related items belong together, not scattered in "personal".
- Sequence by real urgency: honor hard dates ("tomorrow" = tomorrow), and surface dependencies — you can't attend a meeting you never booked, so booking is the task.
- Vary energy honestly. Focused or emotionally-weighty work (sending wedding invites, a hard email) is NOT slump filler.
- Priority reflects consequence + deadline, not a default of "med".
- Turn a vague note into its real next action ("meeting with Andrea? haven't booked" → the task is booking it) — UNLESS the vague-verb rule above applies, in which case it becomes a question instead.

${FOCUS_RULES}
Resolve dates against NOW: ${nowStr()}. Always estimate minutes.`;
}

// Resolves each raw parsed item's stated_date/stated_time (model-supplied,
// unresolved tokens) into a real fixed_time in application code — the model
// never does date/time arithmetic. Also stamps device_id/timezone so the
// items-table trigger can decide reminder eligibility, and defaults
// reminder_offsets. stated_date/stated_time are intermediate signals only;
// they're never persisted.
export function prepareParsedItems(rawItems) {
  const deviceId = getDeviceId();
  const timezone = getUserTimezone();
  const now = new Date();
  return (rawItems || []).map((it) => {
    const { stated_date, stated_time, ...rest } = it;
    const fixed_time = computeFixedTime({ stated_date, stated_time, timezone, now });
    // Notification inversion (Capture design doc §9.3): reminders are
    // opt-out, not opt-in. A timed item already gets one via the DB
    // column default; a deadline-only item (no time given) needs the
    // same default set explicitly here, or it silently gets none.
    const reminder_offsets = (!fixed_time && rest.deadline) ? [1440] : undefined;
    return { ...rest, fixed_time, device_id: deviceId, timezone, ...(reminder_offsets ? { reminder_offsets } : {}) };
  });
}

export function mergeItems(existing, incoming) {
  const out = [...existing];
  for (const it of incoming) {
    if (!it || !it.title) continue;
    const i = out.findIndex(x => x.title.trim().toLowerCase() === it.title.trim().toLowerCase());
    if (i >= 0) out[i] = { ...out[i], ...it }; else out.push({ ...it, id: uid() });
  }
  return out;
}
export function itemDay(i) {
  if (i.fixed_time) { const d = new Date(i.fixed_time); if (!isNaN(d.getTime())) return ymd(d); }
  if (i.deadline) return i.deadline;
  if (i.today) return todayYMD();
  return null;
}
export function whenLabel(i) {
  if (i.fixed_time) { const d = new Date(i.fixed_time); if (!isNaN(d.getTime())) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  if (i.suggested_slot) return i.suggested_slot;
  if (i.deadline) return 'by ' + i.deadline;
  return 'anytime';
}

// New items from an AI merge get a temp local id — this inserts only the brand-new
// ones into Supabase and swaps their temp id for the real DB-generated one.
export async function persistNewItems(mergedList, prevList, userId) {
  const prevIds = new Set(prevList.map(i => i.id));
  const brandNew = mergedList.filter(i => !prevIds.has(i.id));
  if (!brandNew.length) return mergedList;
  const rows = brandNew.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
  const { data, error } = await supabase.from('items').insert(rows).select();
  if (error || !data) return mergedList;
  let idx = 0;
  return mergedList.map(i => (prevIds.has(i.id) ? i : { ...i, id: data[idx++]?.id ?? i.id }));
}
export async function insertAllItems(rawItems, userId) {
  if (!rawItems.length) return [];
  const rows = rawItems.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
  const { data, error } = await supabase.from('items').insert(rows).select();
  if (error || !data) return rawItems;
  return data;
}
export async function replaceAllItems(rawItems, userId) {
  await supabase.from('items').delete().eq('user_id', userId);
  return insertAllItems(rawItems, userId);
}

// Persists typed questions from a parse response, resolving each
// question's item_ref (an index into the parsed items array) to the real
// DB item id via idMap (title.toLowerCase().trim() -> id, built from the
// items just inserted). Profile questions (item_ref null) get item_id null.
export async function persistQuestions(rawQuestions, insertedItems, rawItemsForRefs, userId) {
  const list = rawQuestions || [];
  if (!list.length) return [];
  const rows = list.map((q) => {
    let item_id = null;
    if (q.item_ref !== null && q.item_ref !== undefined && rawItemsForRefs[q.item_ref]) {
      const title = rawItemsForRefs[q.item_ref].title?.trim().toLowerCase();
      const match = insertedItems.find(i => i.title?.trim().toLowerCase() === title);
      item_id = match?.id ?? null;
    }
    return {
      user_id: userId,
      item_id,
      kind: q.kind || 'fact',
      tier: q.tier || 3,
      text: q.text,
      why: q.why || null,
    };
  }).filter(r => r.text);
  if (!rows.length) return [];
  const { data } = await supabase.from('questions').insert(rows).select();
  return data || [];
}

// The shared correction primitive (Activity handoff Phase C / Capture
// design doc §6): one serverless-roundtrip contract, used by Capture's
// composer, Capture's item-view say-box, and (later) Activity's inline
// row exchange and full item chat — all the same call, so "correct from
// anywhere" is free for every surface built on top of this.
//
// Returns either { updates, confirmation, log } (apply + report + log row)
// or { clarify, placeholder } (one clarifying question, caller re-prompts).
export function correctionSystemPrompt(profile) {
  return `You are Sprekta. The person is correcting or adjusting ONE existing item/question through plain language — never ask them to speak in system terms.

${profileContext(profile)}

NOW: ${nowStr()}

Interpretation order: readiness first ("not ready / not today / push it" defers the item even if the utterance also contains a day/time), then flips/reclassification, then timing, then content.

Return ONLY JSON — no prose, no fences — one of these two shapes:
{ "updates": { ...only the item fields that changed: title/kind/deadline/stated_date/stated_time/today/priority/flagged/status/project/notes... }, "confirmation": "one plain line stating what changed, facts not narration — e.g. 'Moved to Wednesday 6:00' or 'Marked done'", "log": { "kind": "edit_field|reclassify|retitle|flag|unflag|promote_today|rest|close", "why": "short reason if any, else empty" } }
or, ONLY if the utterance is genuinely too ambiguous to act on:
{ "clarify": "one short question", "placeholder": "example answer" }

Rules: never dead-end — if nothing actionable can be extracted, fold the words in as a note update rather than clarifying. State facts, never narrate the relationship ("updated" not "I've gone ahead and updated this for you"). No shame framing. stated_date/stated_time follow the same rules as parsing (echo tokens, never resolve them yourself) when the correction changes timing.`;
}

// Applies one scoped correction utterance to one existing item: calls the
// model with correctionSystemPrompt, resolves any stated_date/stated_time
// in the response against the item's OWN stored timezone (not the
// correcting device's), writes the item update + a corrections row, and
// returns a shape the caller renders directly — either an applied receipt
// or a single clarifying question to re-prompt.
export async function applyCorrection({ item, utterance, profile, userId, accessToken, surface }) {
  const system = correctionSystemPrompt(profile);
  const itemSnapshot = {
    title: item.title, kind: item.kind, deadline: item.deadline, priority: item.priority,
    flagged: item.flagged, status: item.status, parked_reason: item.parked_reason,
    project: item.project, notes: item.notes, fixed_time: item.fixed_time, today: item.today,
  };
  const raw = await callClaude({
    system,
    messages: [{ role: 'user', content: `CURRENT ITEM:\n${JSON.stringify(itemSnapshot)}\n\nWHAT THEY SAID:\n${utterance}` }],
    accessToken,
  });
  const parsed = grabJSON(raw);
  if (parsed.clarify) return { kind: 'clarify', clarify: parsed.clarify, placeholder: parsed.placeholder || '' };

  const { stated_date, stated_time, ...updates } = parsed.updates || {};
  if (stated_date !== undefined || stated_time !== undefined) {
    updates.fixed_time = computeFixedTime({ stated_date, stated_time, timezone: item.timezone, now: new Date() });
  }
  // Answering a genuinely-vague ("clarify") item is what forms it into a
  // real item — the user's words become the todo (Capture doc §5.3). A
  // "rest" item stays parked until the user explicitly brings it back
  // (§5.4) — that's a different chip, not a side effect of any correction.
  if (item.status === 'parked' && item.parked_reason === 'clarify') {
    updates.status = 'open';
    updates.parked_reason = null;
  }
  if (Object.keys(updates).length) {
    await supabase.from('items').update(updates).eq('id', item.id);
  }
  await supabase.from('corrections').insert({
    user_id: userId,
    item_id: item.id,
    kind: (parsed.log && parsed.log.kind) || 'edit_field',
    before: itemSnapshot,
    after: updates,
    surface: surface || null,
  });
  return { kind: 'applied', confirmation: parsed.confirmation || 'Updated.', updates, before: itemSnapshot, itemId: item.id };
}

// Reverts one applyCorrection() result — used by the EA confirmation line's
// one-tap undo. Writes the pre-correction snapshot back; does not remove
// the corrections audit row (the row documents that a correction happened
// and was undone, not that it never happened).
export async function undoCorrection({ itemId, before }) {
  if (!before) return;
  await supabase.from('items').update(before).eq('id', itemId);
}
