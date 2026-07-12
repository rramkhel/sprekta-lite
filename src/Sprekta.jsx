import { useState, useEffect, useRef } from 'react';
import { Send, ListTodo, MessageSquare, Clock, Calendar as CalIcon, Check, Loader2, Sparkles, Trash2, ChevronRight, ChevronLeft, Sun, ArrowUp, ArrowDown, Plus, X, CalendarClock, MessageSquarePlus, Zap, AlertCircle, StickyNote, Wand2, FolderInput, LogOut } from 'lucide-react';
import { supabase } from './lib/supabaseClient.js';

const INK = '#22223B', PAPER = '#FAF9F6', CARD = '#FFFFFF', LINE = '#E7E4DC';
const GREEN = '#12886A', AI = '#6A5AE0', MUTED = '#77748A';
const ENERGY = { deep: { label: 'deep', color: '#6A5AE0' }, admin: { label: 'admin', color: '#5B7085' }, physical: { label: 'physical', color: '#C77D2E' } };
const PRIO = { high: '#D8552E', med: '#C79A2E', low: '#9B9A93' };
const PALETTE = ['#7A6FF0', '#2E9E8F', '#C25A76', '#C77D2E', '#4E7CA1', '#8A6D1E', '#5B7085', '#B0568F', '#3F8F5B'];
const labelize = (k) => (k || 'personal').charAt(0).toUpperCase() + (k || 'personal').slice(1);
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'rachel.ramkhelawan@gmail.com';

// New users start with only "Personal" — every other project is detected from a dump
// or created by hand in Settings. Never seed themed projects here.
const SEED_PROJECTS = {
  personal: { label: 'Personal', color: '#6E7B70' },
};
const SEED_PROFILE = {
  rhythm: [],
  defaults: { call: 10, errand: 45, deepBlock: 90 },
  learned: [],
  facts: [],
  priorities: [],
  situations: [],
  onboarded: false,
  projects: SEED_PROJECTS,
};

const EXAMPLE_DUMP = `finish the SACC deck
call dentist to rebook
2hr sprekta block tonight
groceries before sunday
prep 1:1 w rocky friday
oil change sometime this week
gym ~9pm
reply to lilian's board thing by 1pm
visa payment was due yesterday`;

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayYMD = () => ymd(new Date());
const addDays = (n) => ymd(new Date(Date.now() + n * 86400000));
const nowStr = () => new Date().toString();
const uid = () => Math.random().toString(36).slice(2);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const SAMPLE_ITEMS = [
  { title: 'Send wedding invites', kind: 'task', minutes: 60, deadline: addDays(1), energy: 'admin', priority: 'high', project: 'personal', today: true, why: 'Goes out tomorrow — the anchor everything else waits on.' },
  { title: 'Book meeting with Andrea', kind: 'task', minutes: 10, deadline: null, energy: 'admin', priority: 'med', project: 'personal', suggested_slot: 'slump · call' },
  { title: 'Sprekta deep-work block', kind: 'task', minutes: 120, deadline: null, energy: 'deep', priority: 'med', project: 'personal', today: true, why: 'Protecting the goal work before the week fills up.' },
  { title: 'Groceries', kind: 'errand', minutes: 45, deadline: addDays(2), energy: 'physical', priority: 'low', project: 'personal', suggested_slot: 'slump' },
];

function extractText(d) { return (d && Array.isArray(d.content)) ? d.content.filter(b => b.type === 'text').map(b => b.text).join('\n') : ''; }
function splitReplyAndJSON(text) {
  const f = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { let d = null; try { d = JSON.parse(f[1].trim()); } catch {} return { visible: text.replace(f[0], '').trim(), data: d }; }
  return { visible: text.trim(), data: null };
}
function grabJSON(text) {
  let t = text.trim();
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) t = f[1].trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}'); if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}
async function callClaude({ system, messages, accessToken }) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 2048, system, messages }),
  });
  return extractText(await res.json());
}
function profileContext(p) {
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
${(p.situations || []).length ? 'Right now — bend the plan to these:\n' + (p.situations || []).filter(s => s.raw).map(s => `- ${s.raw} [${s.scope}]`).join('\n') : ''}`;
}
function projectMap(projects) {
  const known = Object.entries(projects).map(([k, v]) => `- ${k}: ${v.label}`).join('\n');
  return `PROJECTS — tag every item with the best-fit key:
${known}
Prefer a SPECIFIC project over the "personal" catch-all whenever two or more items share a real theme (a wedding, a trip, a launch). If a real theme has no bucket yet, invent a short lowercase key. Don't scatter related things into "personal".`;
}
const ITEM_FIELDS = `"title", "kind":"task|event|errand", "minutes":number, "deadline":"YYYY-MM-DD"|null, "energy":"deep|admin|physical", "priority":"high|med|low", "suggested_slot": short placement from their rhythm, "project": a project key, "today": boolean, "why": one short warm line — ONLY when today is true`;
const FOCUS_RULES = `Choosing "today" — be an editor, not a list: keep it SMALL (2–4). Include hard anchors (due today / fixed time today). PROTECT one goal-advancing item (usually a Sprekta block) even when nothing forces it. Importance ≠ urgency.
Voice: calm, warm, short. NEVER shame or alarm. Late things are a gentle choice, never a failure.`;

function mergeItems(existing, incoming) {
  const out = [...existing];
  for (const it of incoming) {
    if (!it || !it.title) continue;
    const i = out.findIndex(x => x.title.trim().toLowerCase() === it.title.trim().toLowerCase());
    if (i >= 0) out[i] = { ...out[i], ...it }; else out.push({ ...it, id: uid() });
  }
  return out;
}
function itemDay(i) {
  if (i.fixed_time) { const d = new Date(i.fixed_time); if (!isNaN(d.getTime())) return ymd(d); }
  if (i.deadline) return i.deadline;
  if (i.today) return todayYMD();
  return null;
}
function whenLabel(i) {
  if (i.fixed_time) { const d = new Date(i.fixed_time); if (!isNaN(d.getTime())) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  if (i.suggested_slot) return i.suggested_slot;
  if (i.deadline) return 'by ' + i.deadline;
  return 'anytime';
}

// New items from an AI merge get a temp local id — this inserts only the brand-new
// ones into Supabase and swaps their temp id for the real DB-generated one.
async function persistNewItems(mergedList, prevList, userId) {
  const prevIds = new Set(prevList.map(i => i.id));
  const brandNew = mergedList.filter(i => !prevIds.has(i.id));
  if (!brandNew.length) return mergedList;
  const rows = brandNew.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
  const { data, error } = await supabase.from('items').insert(rows).select();
  if (error || !data) return mergedList;
  let idx = 0;
  return mergedList.map(i => (prevIds.has(i.id) ? i : { ...i, id: data[idx++]?.id ?? i.id }));
}
async function insertAllItems(rawItems, userId) {
  if (!rawItems.length) return [];
  const rows = rawItems.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
  const { data, error } = await supabase.from('items').insert(rows).select();
  if (error || !data) return rawItems;
  return data;
}
async function replaceAllItems(rawItems, userId) {
  await supabase.from('items').delete().eq('user_id', userId);
  return insertAllItems(rawItems, userId);
}

export default function Sprekta({ session, onSignOut }) {
  const [view, setView] = useState('today');
  const [mode, setMode] = useState('offload');
  const [dump, setDump] = useState(EXAMPLE_DUMP);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(SEED_PROFILE);
  const [questions, setQuestions] = useState([]);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [projFilter, setProjFilter] = useState('all');
  const [cal, setCal] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selDay, setSelDay] = useState(todayYMD());
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState('');
  const [read, setRead] = useState('');
  const [justDetected, setJustDetected] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [importText, setImportText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [obActive, setObActive] = useState(false);
  const [obStep, setObStep] = useState('dump');
  const [obDump, setObDump] = useState('');
  const [obBusy, setObBusy] = useState(false);
  const [obErr, setObErr] = useState('');
  const [obItems, setObItems] = useState([]);
  const [obProjects, setObProjects] = useState([]);
  const [obNewProj, setObNewProj] = useState('');
  const [obSituations, setObSituations] = useState([]);
  const [obAnchor, setObAnchor] = useState('');
  const [obReflection, setObReflection] = useState('');
  const [obRhythm, setObRhythm] = useState([]);
  const [obPriorities, setObPriorities] = useState([]);
  const [brk, setBrk] = useState(null);
  const chatEnd = useRef(null);
  const chatBox = useRef(null);
  const itemWriteTimers = useRef({});

  const userId = session.user.id;
  const accessToken = session.access_token;
  const isAdmin = session.user.email === ADMIN_EMAIL;
  const projects = profile.projects || SEED_PROJECTS;
  const projOf = (k) => projects[k] || { label: labelize(k), color: '#6E7B70' };

  // Load profile + items from Supabase on mount / user change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: profileRow } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (cancelled) return;
      if (profileRow) {
        setProfile({
          rhythm: profileRow.rhythm || [],
          defaults: Object.keys(profileRow.defaults || {}).length ? profileRow.defaults : SEED_PROFILE.defaults,
          learned: profileRow.learned || [],
          facts: profileRow.facts || [],
          priorities: profileRow.priorities || [],
          situations: profileRow.situations || [],
          onboarded: !!profileRow.onboarded,
          projects: Object.keys(profileRow.projects || {}).length ? profileRow.projects : SEED_PROJECTS,
        });
      } else {
        await supabase.from('profiles').insert({ user_id: userId, ...SEED_PROFILE });
      }
      const { data: itemRows } = await supabase.from('items').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (cancelled) return;
      setItems(itemRows || []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Debounced profile upsert whenever any profile field changes.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      supabase.from('profiles').upsert({
        user_id: userId,
        rhythm: profile.rhythm,
        defaults: profile.defaults,
        learned: profile.learned,
        facts: profile.facts,
        priorities: profile.priorities,
        situations: profile.situations,
        onboarded: profile.onboarded,
        projects: profile.projects,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [profile, loaded, userId]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, busy]);
  useEffect(() => { const el = chatBox.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 74) + 'px'; } }, [chatInput, mode]);
  // auto-detect new projects the model invents
  useEffect(() => {
    const known = profile.projects || {};
    const missing = [...new Set(items.map(i => i.project).filter(Boolean))].filter(k => !known[k]);
    if (missing.length) {
      setProfile(p => { const proj = { ...(p.projects || {}) }; missing.forEach((k) => { proj[k] = { label: labelize(k), color: PALETTE[Object.keys(proj).length % PALETTE.length] }; }); return { ...p, projects: proj }; });
      setJustDetected(missing);
    }
  }, [items]);
  useEffect(() => { if (loaded && !profile.onboarded && items.length === 0) setObActive(true); }, [loaded]);

  function debouncedItemUpdate(id, patch) {
    clearTimeout(itemWriteTimers.current[id]);
    itemWriteTimers.current[id] = setTimeout(() => {
      supabase.from('items').update(patch).eq('id', id).then(() => {});
    }, 600);
  }

  async function runOffload() {
    if (!dump.trim() || busy) return;
    setBusy(true); setErr(''); setJustDetected([]);
    const system = `You are Sprekta — a sharp, calm second brain. You don't transcribe a dump; you READ it. Before listing anything, notice what these have in common, which one is the real anchor (most time-critical), what depends on what, and what the person hasn't said but would care about.

${profileContext(profile)}

${projectMap(projects)}

Return ONLY JSON — no prose, no fences:
{
  "read": "1–2 warm, specific sentences of genuine insight — the thread connecting these, the anchor, or a dependency/stake worth naming. NOT a summary of the list. Empty string only if there is truly nothing to add.",
  "items": [ { ${ITEM_FIELDS} } ],
  "ask": [ genuinely ambiguous questions — usually empty ]
}

Think, don't transcribe:
- Group by real project. Related items belong together, not scattered in "personal".
- Sequence by real urgency: honor hard dates ("tomorrow" = tomorrow), and surface dependencies — you can't attend a meeting you never booked, so booking is the task.
- Vary energy honestly. Focused or emotionally-weighty work (sending wedding invites, a hard email) is NOT slump filler.
- Priority reflects consequence + deadline, not a default of "med".
- Turn a vague note into its real next action ("meeting with Andrea? haven't booked" → the task is booking it).

${FOCUS_RULES}
Resolve dates against NOW: ${nowStr()}. Always estimate minutes.`;
    try {
      const parsed = grabJSON(await callClaude({ system, messages: [{ role: 'user', content: dump }], accessToken }));
      const merged = mergeItems(items, parsed.items || []);
      setItems(merged);
      setRead(parsed.read || '');
      if (Array.isArray(parsed.ask) && parsed.ask.length) setQuestions(prev => [...prev, ...parsed.ask.filter(Boolean)]);
      await supabase.from('dumps').insert({ user_id: userId, raw_text: dump });
      const withIds = await persistNewItems(merged, items, userId);
      setItems(withIds);
    } catch { setErr('Parse hiccup — try again.'); }
    setBusy(false);
  }
  async function planMyDay() {
    if (!items.length || busy) return;
    setBusy(true); setErr('');
    const system = `You are Sprekta. Given the person's open items, choose today's focus.
${profileContext(profile)}
${FOCUS_RULES}
NOW: ${nowStr()}
Return ONLY JSON: { "today": [ { "title": exact title from list, "why": short warm line } ] }`;
    try {
      const data = grabJSON(await callClaude({ system, messages: [{ role: 'user', content: JSON.stringify(items.map(i => ({ title: i.title, deadline: i.deadline, project: i.project, energy: i.energy, priority: i.priority }))) }], accessToken }));
      const picks = new Map((data.today || []).map(t => [String(t.title).trim().toLowerCase(), t.why]));
      const updated = items.map(i => picks.has(i.title.trim().toLowerCase()) ? { ...i, today: true, why: picks.get(i.title.trim().toLowerCase()) } : { ...i, today: false });
      setItems(updated);
      setView('today');
      await Promise.all(updated.map(i => supabase.from('items').update({ today: i.today, why: i.why ?? null }).eq('id', i.id)));
    } catch { setErr('Couldn’t re-plan — try again.'); }
    setBusy(false);
  }
  async function sendChat(seed) {
    const content = (seed ?? chatInput).trim();
    if (!content || busy) return;
    const next = [...chat, { role: 'user', content }];
    setChat(next); setChatInput(''); setBusy(true); setErr('');
    const system = `You are Sprekta, a calm planning partner. The person brings a messy situation; think it through WITH them and turn uncertainty into a schedulable plan.
${profileContext(profile)}
${projectMap(projects)}
NOW: ${nowStr()}
- Ask minimal, sharp questions — one or two at a time. The more you know, the less you ask.
- Push toward output: sequence, name concrete tasks, commit them.
${FOCUS_RULES}
When concrete to-dos emerge, append at the very END, only then:
\`\`\`json
{ "items": [ { ${ITEM_FIELDS} } ] }
\`\`\`
Keep the spoken reply short and warm. Never mention the block.`;
    try {
      const text = await callClaude({ system, messages: next.map(m => ({ role: m.role, content: m.content })), accessToken });
      const { visible, data } = splitReplyAndJSON(text);
      setChat(c => [...c, { role: 'assistant', content: visible || '…' }]);
      if (data && Array.isArray(data.items) && data.items.length) {
        const merged = mergeItems(items, data.items);
        setItems(merged);
        const withIds = await persistNewItems(merged, items, userId);
        setItems(withIds);
      }
    } catch { setChat(c => [...c, { role: 'assistant', content: 'Hit a snag — mind resending?' }]); }
    setBusy(false);
  }
  function nudgeToChat(seed) { setDetailId(null); setView('plan'); setMode('think'); sendChat(seed); }

  // ---- onboarding ----
  const toggleRhythm = (v) => setObRhythm(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v]);
  const addObProj = () => { const k = obNewProj.trim().toLowerCase().replace(/[^a-z0-9]+/g, ''); if (k && !obProjects.includes(k)) setObProjects([...obProjects, k]); setObNewProj(''); };
  function startBracket() { const c = obProjects; const pairs = []; for (let a = 0; a < c.length; a++) for (let b = a + 1; b < c.length; b++) pairs.push([c[a], c[b]]); setBrk({ pairs, idx: 0, wins: Object.fromEntries(c.map(x => [x, 0])) }); }
  function brkPick(w) { const wins = { ...brk.wins, [w]: (brk.wins[w] || 0) + 1 }; const idx = brk.idx + 1; if (idx >= brk.pairs.length) { setObPriorities(Object.keys(wins).sort((a, b) => wins[b] - wins[a])); setBrk(null); } else setBrk({ ...brk, idx, wins }); }
  async function obParse() {
    if (!obDump.trim() || obBusy) return;
    setObBusy(true); setObErr('');
    const system = `You are Sprekta onboarding a new user from their first brain-dump. Read it and infer their world — don't transcribe.
${projectMap(projects)}
Return ONLY JSON:
{ "items": [ { ${ITEM_FIELDS} } ],
  "situations": [ { "raw": short phrase, "scope": "ongoing|season|moment" } ],
  "anchor_guess": "the project key most likely to be the thing they don't want crowded out",
  "reflection": "2-3 warm, honestly-hedged sentences reading their world back — name the projects, the likely anchor, any season. You are interpreting; invite correction." }
Group into real projects (invent short lowercase keys when a theme has no bucket). Infer situations from context. NOW: ${nowStr()}.`;
    try {
      const data = grabJSON(await callClaude({ system, messages: [{ role: 'user', content: obDump }], accessToken }));
      const its = (data.items || []).map(x => ({ ...x, id: uid() }));
      setObItems(its);
      setObProjects([...new Set(its.map(i => i.project).filter(Boolean))]);
      setObSituations(data.situations || []);
      setObAnchor(data.anchor_guess || '');
      setObReflection(data.reflection || '');
      setObStep('projects');
    } catch { setObErr('Hmm — let me try that again.'); }
    setObBusy(false);
  }
  async function obFinish(goSettings) {
    const projObj = { ...projects };
    obProjects.forEach((k) => { if (!projObj[k]) projObj[k] = { label: labelize(k), color: PALETTE[Object.keys(projObj).length % PALETTE.length] }; });
    const insertedItems = await insertAllItems(obItems, userId);
    if (obDump.trim()) await supabase.from('dumps').insert({ user_id: userId, raw_text: obDump });
    setItems(insertedItems);
    setProfile(p => ({ ...p, projects: projObj, rhythm: obRhythm.length ? ['Sharpest for hard work: ' + obRhythm.join(', ')] : p.rhythm, priorities: obPriorities.length ? obPriorities : (obAnchor ? [obAnchor] : []), situations: obSituations, onboarded: true }));
    setObActive(false); setView(goSettings ? 'settings' : 'today');
  }
  const setSit = (i, patch) => setProfile(p => ({ ...p, situations: (p.situations || []).map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const addSit = () => setProfile(p => ({ ...p, situations: [...(p.situations || []), { raw: '', scope: 'moment' }] }));
  const delSit = (i) => setProfile(p => ({ ...p, situations: (p.situations || []).filter((_, idx) => idx !== i) }));
  async function breakDown(it) {
    setBusy(true);
    try {
      const text = await callClaude({ system: 'You are Sprekta. Break this task into a short, concrete approach: 2–4 plain bullet steps. No preamble.', messages: [{ role: 'user', content: it.title + (it.why ? ' — ' + it.why : '') }], accessToken });
      const newNotes = (it.notes ? it.notes + '\n' : '') + text.trim();
      setItems(prev => prev.map(i => i.id === it.id ? { ...i, notes: newNotes } : i));
      await supabase.from('items').update({ notes: newNotes }).eq('id', it.id);
    } catch { setErr('Couldn’t break it down.'); }
    setBusy(false);
  }
  function teach() {
    if (!answer.trim() || !questions.length) return;
    setProfile(p => ({ ...p, learned: [...p.learned, `${questions[0]} → ${answer.trim()}`] }));
    setQuestions(q => q.slice(1)); setAnswer('');
  }
  const complete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setDetailId(d => d === id ? null : d);
    supabase.from('items').delete().eq('id', id).then(() => {});
  };
  const defer = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, today: false } : i));
    supabase.from('items').update({ today: false }).eq('id', id).then(() => {});
  };
  const promote = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, today: true } : i));
    supabase.from('items').update({ today: true }).eq('id', id).then(() => {});
  };
  const setField = (id, patch) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    debouncedItemUpdate(id, patch);
  };
  const clearAllItems = () => {
    setItems([]); setRead(''); setJustDetected([]);
    supabase.from('items').delete().eq('user_id', userId).then(() => {});
  };
  const editArr = (key, idx, val) => setProfile(p => ({ ...p, [key]: p[key].map((x, i) => i === idx ? val : x) }));
  const addArr = (key) => setProfile(p => ({ ...p, [key]: [...p[key], ''] }));
  const delArr = (key, idx) => setProfile(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  const setDef = (k, v) => setProfile(p => ({ ...p, defaults: { ...p.defaults, [k]: Number(v) || 0 } }));
  const setProj = (k, patch) => setProfile(p => ({ ...p, projects: { ...p.projects, [k]: { ...p.projects[k], ...patch } } }));
  const addProj = () => setProfile(p => { const key = 'p' + Date.now().toString(36).slice(-4); return { ...p, projects: { ...p.projects, [key]: { label: 'New project', color: PALETTE[Object.keys(p.projects).length % PALETTE.length] } } }; });
  const delProj = (k) => setProfile(p => { const proj = { ...p.projects }; delete proj[k]; return { ...p, projects: proj }; });

  async function sendFeedback() {
    if (!feedbackText.trim()) return;
    await supabase.from('feedback').insert({ user_id: userId, text: feedbackText.trim() });
    setFeedbackText('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2500);
  }

  // ---- dev tools (admin only, still RLS-scoped to the caller's own rows) ----
  async function devStartFresh() {
    if (!window.confirm('Wipe all items and reset your profile to seed?')) return;
    setItems([]); setRead(''); setQuestions([]); setJustDetected([]);
    setProfile(SEED_PROFILE);
    await supabase.from('items').delete().eq('user_id', userId);
  }
  function devRestoreProfile() {
    setProfile(p => ({ ...SEED_PROFILE, projects: p.projects }));
  }
  async function devLoadSample() {
    const inserted = await replaceAllItems(SAMPLE_ITEMS, userId);
    setItems(inserted);
  }
  async function devLoadSnapshot() {
    try {
      const d = JSON.parse(importText);
      if (Array.isArray(d.items)) {
        const inserted = await replaceAllItems(d.items, userId);
        setItems(inserted);
      }
      if (d.profile) setProfile({ ...SEED_PROFILE, ...d.profile });
      setImportText('');
    } catch { setErr('Bad JSON — check the snapshot.'); }
  }
  function devRunOnboarding() {
    setObDump(''); setObItems([]); setObProjects([]); setObRhythm([]); setObPriorities([]); setBrk(null); setObStep('dump'); setObActive(true);
  }

  const T = todayYMD(), TM = addDays(1), W = addDays(6);
  const isOverdue = (i) => { const d = itemDay(i); return d && d < T; };
  const urgent = items.filter(i => i.priority === 'high' && !isOverdue(i) && (() => { const d = itemDay(i); return d && d <= TM; })());
  const todayList = items.filter(i => i.today || itemDay(i) === T);
  const decisions = items.filter(isOverdue);
  const tomorrowList = items.filter(i => itemDay(i) === TM);
  const weekList = items.filter(i => { const d = itemDay(i); return d && d > TM && d <= W; });
  const iconBtn = { background: 'none', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer', padding: 5, display: 'flex', alignItems: 'center', color: MUTED };
  const tint = (c) => c + '22';
  const devBtn = { fontSize: 12.5, color: '#B4552E', background: '#fff', border: '1px solid #F0D9D0', borderRadius: 8, padding: '6px 11px', cursor: 'pointer' };
  const obNextBtn = { fontSize: 14.5, fontWeight: 500, color: '#fff', background: AI, border: 'none', borderRadius: 12, padding: '11px 18px', cursor: 'pointer' };

  function card(it, opts = {}) {
    const p = projOf(it.project);
    return (
      <div key={it.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px' }}>
        <button onClick={() => setDetailId(it.id)} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
          </div>
          <div style={{ fontSize: 12, color: whenLabel(it) === 'anytime' ? MUTED : GREEN, marginTop: 3, marginLeft: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{whenLabel(it)}</div>
        </button>
        <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
          <button title="Done" onClick={() => complete(it.id)} style={{ ...iconBtn, color: GREEN, borderColor: '#CDE7DD' }}><Check size={15} /></button>
          {it.today
            ? <button title="Not today" onClick={() => defer(it.id)} style={iconBtn}><ArrowDown size={15} /></button>
            : <button title="Do today" onClick={() => promote(it.id)} style={iconBtn}><ArrowUp size={15} /></button>}
        </div>
      </div>
    );
  }

  const projectKeys = Object.keys(projects);
  const Tab = ({ id, label, Icon }) => (
    <button onClick={() => setView(id)} className="flex items-center gap-1.5" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', fontSize: 13.5, fontWeight: view === id ? 600 : 500, color: view === id ? INK : MUTED, borderBottom: `2px solid ${view === id ? AI : 'transparent'}` }}>
      <Icon size={15} /> {label}
    </button>
  );

  if (obActive) {
    const steps = ['dump', 'projects', 'rhythm', 'priority', 'reflect'];
    const si = steps.indexOf(obStep);
    const wrap = (children) => (
      <div style={{ background: PAPER, color: INK, minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 44px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Sprekta<span style={{ color: GREEN }}>.</span></div>
            <div className="flex gap-1.5">{steps.map((s, i) => <span key={s} style={{ width: i === si ? 18 : 7, height: 7, borderRadius: 999, background: i <= si ? AI : '#E0DEEA' }} />)}</div>
          </div>
          {children}
        </div>
      </div>
    );
    const skipLink = (label, fn) => <button onClick={fn} style={{ display: 'block', fontSize: 13, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', marginTop: 14 }}>{label}</button>;

    if (obStep === 'dump') return wrap(
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>Let’s start with everything on your plate.</div>
        <div style={{ fontSize: 14.5, color: '#4A4860', lineHeight: 1.55, marginBottom: 16 }}>Dump it all out — tasks, worries, half-thoughts, in any order. Messy is exactly right. I’ll read it and make the first pass, so you never have to start from a blank setup.</div>
        <textarea value={obDump} onChange={e => setObDump(e.target.value)} rows={7} placeholder={'e.g. finish the SACC deck, wedding invites go out this week, book a meeting with andrea, 2hr sprekta block, getting back into lifting…'} style={{ width: '100%', resize: 'none', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14, fontSize: 15, lineHeight: 1.6, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit', marginBottom: 12 }} />
        {obErr && <div style={{ fontSize: 13, color: '#B23', marginBottom: 8 }}>{obErr}</div>}
        <button onClick={obParse} disabled={obBusy || !obDump.trim()} className="flex items-center gap-2" style={{ ...obNextBtn, background: (obBusy || !obDump.trim()) ? '#B7B3DE' : AI }}>{obBusy ? <><Loader2 size={16} className="animate-spin" /> reading it…</> : <><Sparkles size={16} /> Make sense of this</>}</button>
        {skipLink('I’ll set up later', () => { setProfile(p => ({ ...p, onboarded: true })); setObActive(false); })}
      </div>
    );

    if (obStep === 'projects') return wrap(
      <div>
        <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 8 }}>Here’s how your world splits — did I read it right?</div>
        <div style={{ fontSize: 14, color: '#4A4860', marginBottom: 16 }}>I grouped what you dumped into these. Add anything I missed, or drop one that’s off — I’m guessing from your words.</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {obProjects.map(k => { const p = projOf(k); return (
            <span key={k} className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: p.color, background: p.color + '22', borderRadius: 999, padding: '6px 12px' }}>{p.label}<button onClick={() => setObProjects(obProjects.filter(x => x !== k))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.color, display: 'flex' }}><X size={13} /></button></span>
          ); })}
          {obProjects.length === 0 && <span style={{ fontSize: 13.5, color: MUTED }}>Add the buckets your life falls into…</span>}
        </div>
        <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
          <input value={obNewProj} onChange={e => setObNewProj(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addObProj(); }} placeholder="add a project…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 12px', fontSize: 14, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit' }} />
          <button onClick={addObProj} style={{ ...iconBtn, padding: '8px 10px' }}><Plus size={15} /></button>
        </div>
        <button onClick={() => setObStep('rhythm')} style={obNextBtn}>Looks right →</button>
      </div>
    );

    if (obStep === 'rhythm') return wrap(
      <div>
        <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 8 }}>When’s your head clearest for hard work?</div>
        <div style={{ fontSize: 14, color: '#4A4860', marginBottom: 18 }}>So I put deep work where you’ll actually do it — not just wherever there’s a gap. Tap any that fit.</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
          {['Early morning', 'Midday', 'Evening', 'Late night', 'It varies'].map(v => { const on = obRhythm.includes(v); return (
            <button key={v} onClick={() => toggleRhythm(v)} style={{ fontSize: 13.5, borderRadius: 999, padding: '9px 15px', cursor: 'pointer', border: `1px solid ${on ? AI : LINE}`, background: on ? '#EEEDFB' : CARD, color: on ? AI : MUTED, fontWeight: on ? 600 : 500 }}>{v}</button>
          ); })}
        </div>
        <button onClick={() => setObStep('priority')} style={obNextBtn}>Continue →</button>
        {skipLink('Skip — you’ll learn my rhythm', () => setObStep('priority'))}
      </div>
    );

    if (obStep === 'priority') {
      if (brk) { const pair = brk.pairs[brk.idx]; return wrap(
        <div>
          <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 8 }}>Quick gut check.</div>
          <div style={{ fontSize: 14, color: '#4A4860', marginBottom: 20 }}>Don’t overthink it — which matters more right now? <span style={{ color: MUTED }}>({brk.idx + 1} of {brk.pairs.length})</span></div>
          <div className="flex gap-3">
            {pair.map(k => { const p = projOf(k); return (
              <button key={k} onClick={() => brkPick(k)} style={{ flex: 1, padding: '24px 14px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${p.color}55`, background: p.color + '14', fontSize: 16, fontWeight: 600, color: p.color }}>{p.label}</button>
            ); })}
          </div>
        </div>
      ); }
      return wrap(
        <div>
          <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 8 }}>What can’t get crowded out?</div>
          <div style={{ fontSize: 14, color: '#4A4860', marginBottom: 16 }}>When the week gets tight, I’ll guard this first. My best guess is highlighted — pick the real one, or let me help you rank them.</div>
          <div className="flex flex-col gap-2" style={{ marginBottom: 14 }}>
            {obProjects.map(k => { const p = projOf(k), sel = obPriorities[0] === k || (!obPriorities.length && obAnchor === k); return (
              <button key={k} onClick={() => setObPriorities([k, ...obProjects.filter(x => x !== k)])} className="flex items-center justify-between" style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${sel ? AI : LINE}`, background: sel ? '#EEEDFB' : CARD, fontSize: 14.5, fontWeight: 500, color: INK }}>
                <span className="flex items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: p.color }} />{p.label}</span>
                {sel && <Check size={16} style={{ color: AI }} />}
              </button>
            ); })}
          </div>
          {obProjects.length >= 2 && <button onClick={startBracket} style={{ display: 'block', fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>Not sure — help me rank them →</button>}
          <button onClick={() => setObStep('reflect')} style={obNextBtn}>Continue →</button>
          {skipLink('Skip', () => setObStep('reflect'))}
        </div>
      );
    }

    if (obStep === 'reflect') return wrap(
      <div>
        <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 12 }}>Here’s how I read your world.</div>
        <div style={{ background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 14, padding: 16, fontSize: 14.5, color: '#3B3856', lineHeight: 1.6, marginBottom: 16 }}>{obReflection || 'You’ve got a full plate across a few projects. I’ll sort it and keep the important things from getting buried.'}</div>
        <div className="flex flex-col gap-2" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13.5 }}><span style={{ color: MUTED }}>Projects · </span>{obProjects.map(k => projOf(k).label).join(', ') || '—'}</div>
          <div style={{ fontSize: 13.5 }}><span style={{ color: MUTED }}>Deep-work window · </span>{obRhythm.join(', ') || 'you’ll show me'}</div>
          <div style={{ fontSize: 13.5 }}><span style={{ color: MUTED }}>Protecting · </span>{obPriorities[0] ? projOf(obPriorities[0]).label : (obAnchor ? projOf(obAnchor).label : '—')}</div>
          {obSituations.length > 0 && <div style={{ fontSize: 13.5 }}><span style={{ color: MUTED }}>Noticed · </span>{obSituations.map(s => s.raw).join('; ')}</div>}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>Got something wrong? All of this is editable anytime in Settings.</div>
        <div className="flex gap-2">
          <button onClick={() => obFinish(false)} style={obNextBtn}>This is right — let’s go</button>
          <button onClick={() => obFinish(true)} style={{ fontSize: 14, color: MUTED, background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 16px', cursor: 'pointer' }}>Tweak it</button>
        </div>
      </div>
    );
    return wrap(<div />);
  }

  return (
    <div style={{ background: PAPER, color: INK, minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '22px 18px 40px' }}>

        <div style={{ marginBottom: 16, borderBottom: `1px solid ${LINE}`, paddingBottom: 11 }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 9 }}>Sprekta<span style={{ color: GREEN }}>.</span></div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <Tab id="today" label="Today" Icon={Sun} />
            <Tab id="plan" label="Plan" Icon={ListTodo} />
            <Tab id="calendar" label="Calendar" Icon={CalIcon} />
            <Tab id="settings" label="Settings" Icon={MessageSquare} />
          </div>
        </div>

        {err && <div style={{ fontSize: 13, color: '#B23', marginBottom: 14 }}>{err}</div>}

        {/* ============ TODAY ============ */}
        {view === 'today' && (
          <div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>

            {urgent.length > 0 && (
              <div style={{ background: '#FCEEE8', border: '1px solid #F1D3C6', borderRadius: 14, padding: 13, marginBottom: 16 }}>
                <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, color: '#B4552E', marginBottom: 8 }}><AlertCircle size={15} /> Coming up fast</div>
                <div className="flex flex-col gap-2">{urgent.map(it => card(it, {}))}</div>
              </div>
            )}

            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}><Sun size={16} style={{ color: AI }} /><div style={{ fontSize: 15, fontWeight: 600 }}>What matters today</div></div>
            {todayList.length === 0
              ? <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: 18, textAlign: 'center', color: MUTED, fontSize: 13.5, marginBottom: 18 }}>Nothing locked today. Good day to protect a Sprekta block — or hit <b>Plan my day</b>.</div>
              : <div className="flex flex-col gap-2" style={{ marginBottom: 18 }}>{todayList.map(it => card(it, {}))}</div>}

            {decisions.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4A4860', marginBottom: 4 }}>A few things to decide</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>These slipped past their date. Keep them going, or let them go — no rush.</div>
                <div className="flex flex-col gap-2">{decisions.map(it => card(it, {}))}</div>
              </div>
            )}

            {(tomorrowList.length > 0 || weekList.length > 0) && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4A4860', marginBottom: 8 }}>Coming up</div>
                <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '4px 0' }}>
                  {[['Tomorrow', tomorrowList], ['This week', weekList]].map(([label, list]) => list.length > 0 && (
                    <div key={label} style={{ padding: '9px 13px', borderBottom: label === 'Tomorrow' && weekList.length ? `1px solid ${LINE}` : 'none' }}>
                      <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label} · {list.length}</div>
                      <div className="flex flex-col gap-1.5">{list.map(it => (
                        <button key={it.id} onClick={() => setDetailId(it.id)} className="flex items-center gap-2" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13.5, color: INK, textAlign: 'left' }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: projOf(it.project).color, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                        </button>
                      ))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tomorrowList.length + weekList.length + decisions.length) >= 2 && (
              <button onClick={() => nudgeToChat(`Help me sequence what's coming — I've got ${[...decisions, ...tomorrowList, ...weekList].slice(0, 6).map(i => i.title).join(', ')}. What order makes sense for my week?`)}
                style={{ width: '100%', textAlign: 'left', background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
                <div className="flex items-center gap-2" style={{ fontSize: 13.5, fontWeight: 600, color: AI, marginBottom: 3 }}><MessageSquarePlus size={15} /> Think it through with me</div>
                <div style={{ fontSize: 13, color: '#5A5878', lineHeight: 1.5 }}>Want to talk through the order before the week starts?</div>
              </button>
            )}
          </div>
        )}

        {/* ============ PLAN ============ */}
        {view === 'plan' && (
          <div>
            <div className="flex gap-2" style={{ marginBottom: 12 }}>
              {[['offload', 'Offload', ListTodo], ['think', 'Think it through', MessageSquare]].map(([k, label, Icon]) => (
                <button key={k} onClick={() => setMode(k)} className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 500, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', background: mode === k ? INK : CARD, color: mode === k ? '#fff' : MUTED, border: `1px solid ${mode === k ? INK : LINE}` }}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {mode === 'offload' ? (
              <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, marginBottom: 18 }}>
                <textarea value={dump} onChange={e => setDump(e.target.value)} rows={3} placeholder="brain-dump it…" style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, height: '4.8em', maxHeight: '4.8em', overflowY: 'auto', background: 'transparent', color: INK, fontFamily: 'inherit' }} />
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: MUTED }}>sorting it is my job</span>
                  <button onClick={runOffload} disabled={busy} className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 500, color: '#fff', background: busy ? '#9A96C9' : AI, border: 'none', borderRadius: 10, padding: '9px 16px', cursor: busy ? 'default' : 'pointer' }}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Build my plan</button>
                </div>
              </div>
            ) : (
              <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, marginBottom: 18 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
                  {chat.length === 0 && (
                    <div style={{ padding: '6px 2px 12px' }}>
                      <div style={{ fontSize: 14, color: '#4A4860', marginBottom: 10 }}>Bring me the messy version. What’s the tangle?</div>
                      <button onClick={() => sendChat("3 deadlines colliding next week and I'm on-call Thursday — help me sequence it")} style={{ fontSize: 13, color: AI, background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', textAlign: 'left' }}>“3 deadlines colliding + on-call Thursday”</button>
                    </div>
                  )}
                  {chat.map((m, i) => (
                    <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '82%', fontSize: 14, lineHeight: 1.55, padding: '9px 13px', borderRadius: 14, background: m.role === 'user' ? INK : '#F3F2F9', color: m.role === 'user' ? '#fff' : '#33314A', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                  ))}
                  {busy && <div style={{ fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" /> thinking…</div>}
                  <div ref={chatEnd} />
                </div>
                <div className="flex items-end gap-2" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                  <textarea ref={chatBox} value={chatInput} rows={1} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="talk it through…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 12px', fontSize: 14, lineHeight: 1.5, outline: 'none', color: INK, fontFamily: 'inherit', resize: 'none', maxHeight: 74, overflowY: 'auto' }} />
                  <button onClick={() => sendChat()} disabled={busy} style={{ background: AI, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' }}><Send size={16} /></button>
                </div>
              </div>
            )}

            {questions.length > 0 && (
              <div style={{ background: '#FFF9EC', border: '1px solid #F0E2BE', borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8A6D1E', marginBottom: 8 }}>One quick thing, so I get it right</div>
                <div style={{ fontSize: 14, color: '#5B4B1E', marginBottom: 10 }}>{questions[0]}</div>
                <div className="flex items-center gap-2">
                  <input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') teach(); }} placeholder="tell me once…" style={{ flex: 1, border: '1px solid #E7D9AE', borderRadius: 10, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }} />
                  <button onClick={teach} style={{ background: '#8A6D1E', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Got it</button>
                </div>
              </div>
            )}

            {read && (
              <div style={{ background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <div className="flex items-center gap-2" style={{ fontSize: 12.5, fontWeight: 600, color: AI, marginBottom: 5 }}><Sparkles size={14} /> Sprekta’s read</div>
                <div style={{ fontSize: 14, color: '#3B3856', lineHeight: 1.55 }}>{read}</div>
              </div>
            )}

            {justDetected.length > 0 && (
              <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: AI, marginBottom: 12 }}>
                <FolderInput size={14} /> Sprekta created a new project: <b>{justDetected.map(k => projOf(k).label).join(', ')}</b>
              </div>
            )}

            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4A4860' }}>Everything{items.length > 0 && <span style={{ color: MUTED, fontWeight: 400 }}> · {items.length}</span>}</div>
              <div className="flex items-center gap-3">
                {items.length > 0 && <button onClick={planMyDay} disabled={busy} className="flex items-center gap-1" style={{ fontSize: 12.5, color: AI, background: 'none', border: 'none', cursor: 'pointer' }}><CalendarClock size={14} /> Plan my day</button>}
                {items.length > 0 && <button onClick={clearAllItems} className="flex items-center gap-1" style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /> clear</button>}
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                {[['all', 'All']].concat(projectKeys.filter(k => items.some(i => (i.project || 'personal') === k)).map(k => [k, projOf(k).label])).map(([k, label]) => (
                  <button key={k} onClick={() => setProjFilter(k)} style={{ fontSize: 12.5, borderRadius: 999, padding: '4px 11px', cursor: 'pointer', border: `1px solid ${projFilter === k ? INK : LINE}`, background: projFilter === k ? INK : CARD, color: projFilter === k ? '#fff' : MUTED }}>{label}</button>
                ))}
              </div>
            )}

            {items.length === 0
              ? <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '26px 20px', textAlign: 'center', color: MUTED, fontSize: 14 }}>Empty for now. Dump what’s on your plate, or talk a hard week through.</div>
              : <div className="flex flex-col gap-2">{items.filter(i => projFilter === 'all' || (i.project || 'personal') === projFilter).slice().sort((a, b) => ({ high: 0, med: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, med: 1, low: 2 }[b.priority] ?? 1)).map(it => card(it, {}))}</div>}
          </div>
        )}

        {/* ============ CALENDAR ============ */}
        {view === 'calendar' && (() => {
          const start = new Date(cal.y, cal.m, 1).getDay();
          const dim = new Date(cal.y, cal.m + 1, 0).getDate();
          const cells = []; for (let i = 0; i < start; i++) cells.push(null); for (let d = 1; d <= dim; d++) cells.push(d);
          const undated = items.filter(i => !itemDay(i)).length;
          const selItems = items.filter(i => itemDay(i) === selDay);
          return (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <button onClick={() => setCal(c => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m }; })} style={iconBtn}><ChevronLeft size={16} /></button>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{MONTHS[cal.m]} {cal.y}</div>
                <button onClick={() => setCal(c => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m }; })} style={iconBtn}><ChevronRight size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>{WD.map(w => <div key={w} style={{ textAlign: 'center', fontSize: 11, color: MUTED }}>{w}</div>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                {cells.map((d, idx) => {
                  if (!d) return <div key={idx} />;
                  const ds = `${cal.y}-${pad(cal.m + 1)}-${pad(d)}`, di = items.filter(i => itemDay(i) === ds), isT = ds === T, isSel = ds === selDay;
                  const cols = [...new Set(di.map(i => projOf(i.project).color))].slice(0, 3);
                  return (
                    <button key={idx} onClick={() => setSelDay(ds)} style={{ minHeight: 44, borderRadius: 9, cursor: 'pointer', padding: '4px 0 3px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: isSel ? '#EEEDFB' : CARD, border: `1px solid ${isSel ? AI : LINE}` }}>
                      <span style={{ fontSize: 12.5, fontWeight: isT ? 700 : 500, color: isT ? AI : INK }}>{d}</span>
                      <div className="flex gap-0.5">{cols.map((c, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: c }} />)}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4A4860', marginBottom: 8 }}>{new Date(selDay + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                {selItems.length === 0 ? <div style={{ fontSize: 13, color: MUTED }}>Nothing here.</div> : <div className="flex flex-col gap-2">{selItems.map(it => card(it, {}))}</div>}
                {undated > 0 && <div style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>{undated} unscheduled — see Plan.</div>}
              </div>
            </div>
          );
        })()}

        {/* ============ SETTINGS ============ */}
        {view === 'settings' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: AI, marginBottom: 8 }}>Projects</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>Make your own, or let Sprekta detect them from what you dump. These are the buckets your life sorts into.</div>
            <div className="flex flex-col gap-2" style={{ marginBottom: 10 }}>
              {projectKeys.map(k => (
                <div key={k} className="flex items-center gap-2">
                  <input type="color" value={projects[k].color} onChange={e => setProj(k, { color: e.target.value })} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  <input value={projects[k].label} onChange={e => setProj(k, { label: e.target.value })} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '7px 11px', fontSize: 13.5, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit' }} />
                  <button onClick={() => delProj(k)} style={iconBtn}><X size={14} /></button>
                </div>
              ))}
              <button onClick={addProj} className="flex items-center gap-1" style={{ fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}><Plus size={14} /> new project</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 8px' }}>Your rhythm</div>
            <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
              {profile.rhythm.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={r} onChange={e => editArr('rhythm', i, e.target.value)} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', fontSize: 13.5, outline: 'none', background: CARD, fontFamily: 'inherit', color: INK }} />
                  <button onClick={() => delArr('rhythm', i)} style={iconBtn}><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => addArr('rhythm')} className="flex items-center gap-1" style={{ fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}><Plus size={14} /> add a rule</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 8px' }}>Default durations</div>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              {[['call', 'quick call'], ['errand', 'errand'], ['deepBlock', 'deep block']].map(([k, label]) => (
                <div key={k} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 11px' }}>
                  <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 3 }}>{label}</div>
                  <div className="flex items-center gap-1"><input type="number" value={profile.defaults[k]} onChange={e => setDef(k, e.target.value)} style={{ width: 46, border: 'none', outline: 'none', fontSize: 15, background: 'transparent', color: INK, fontFamily: 'inherit' }} /><span style={{ fontSize: 12, color: MUTED }}>min</span></div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 8px' }}>What I’ve learned about you</div>
            {profile.learned.length === 0
              ? <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Nothing yet. Answer a check-in and it lands here — editable, and I stop asking.</div>
              : <div className="flex flex-col gap-2" style={{ marginBottom: 8 }}>{profile.learned.map((l, i) => (
                  <div key={i} className="flex items-center gap-2"><Check size={14} style={{ color: GREEN, flexShrink: 0 }} /><input value={l} onChange={e => editArr('learned', i, e.target.value)} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', fontSize: 13.5, outline: 'none', background: CARD, fontFamily: 'inherit', color: INK }} /><button onClick={() => delArr('learned', i)} style={iconBtn}><X size={14} /></button></div>))}</div>}
            <button onClick={() => addArr('learned')} className="flex items-center gap-1" style={{ fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={14} /> add something yourself</button>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 8px' }}>Life facts</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>The context I use to connect the dots — people, dates, what matters to you.</div>
            <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
              {(profile.facts || []).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={e => editArr('facts', i, e.target.value)} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', fontSize: 13.5, outline: 'none', background: CARD, fontFamily: 'inherit', color: INK }} />
                  <button onClick={() => delArr('facts', i)} style={iconBtn}><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => addArr('facts')} className="flex items-center gap-1" style={{ fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}><Plus size={14} /> add a fact</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 4px' }}>Right now</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>Tell me what’s going on and I bend the plan to it — a busy season, a rough day, an ongoing part of your life. You describe it; I read the scope.</div>
            <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
              {(profile.situations || []).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.raw} onChange={e => setSit(i, { raw: e.target.value })} placeholder="e.g. getting married in 3 months" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', fontSize: 13.5, outline: 'none', background: CARD, fontFamily: 'inherit', color: INK }} />
                  <select value={s.scope} onChange={e => setSit(i, { scope: e.target.value })} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: '7px 8px', fontSize: 12.5, background: CARD, color: INK, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <option value="moment">today</option>
                    <option value="season">season</option>
                    <option value="ongoing">ongoing</option>
                  </select>
                  <button onClick={() => delSit(i)} style={iconBtn}><X size={14} /></button>
                </div>
              ))}
              <button onClick={addSit} className="flex items-center gap-1" style={{ fontSize: 13, color: AI, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}><Plus size={14} /> add a situation</button>
            </div>

            <div style={{ background: '#F4F3F0', border: `1px dashed ${LINE}`, borderRadius: 12, padding: 14, marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 4 }}>Behavioural profile — coming later</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>The deeper read: what you actually do vs. plan. Learned quietly from use.</div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '22px 0 8px' }}>Send feedback</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>Tell me what's broken, confusing, or what you wish it did.</div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} placeholder="what's on your mind…" style={{ width: '100%', resize: 'vertical', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.55, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit', marginBottom: 8 }} />
            <div className="flex items-center gap-2">
              <button onClick={sendFeedback} style={{ fontSize: 13, fontWeight: 500, color: '#fff', background: AI, border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}>Send feedback</button>
              {feedbackSent && <span style={{ fontSize: 12.5, color: GREEN }}>Thanks — got it.</span>}
            </div>

            {isAdmin && (
              <div style={{ border: `1px solid #F0D9D0`, background: '#FCF6F3', borderRadius: 12, padding: 14, marginTop: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#B4552E', marginBottom: 10 }}>Developer tools · test only</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: showRaw ? 12 : 0 }}>
                  <button onClick={devStartFresh} style={devBtn}>Start fresh</button>
                  <button onClick={devRestoreProfile} style={devBtn}>Restore my profile</button>
                  <button onClick={devLoadSample} style={devBtn}>Load sample tasks</button>
                  <button onClick={devRunOnboarding} style={devBtn}>Run onboarding</button>
                  <button onClick={() => setShowRaw(s => !s)} style={devBtn}>{showRaw ? 'Hide' : 'Show'} raw state</button>
                </div>
                {showRaw && (
                  <div>
                    <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 4 }}>Current state — copy to save a snapshot:</div>
                    <textarea readOnly value={JSON.stringify({ items, profile }, null, 2)} rows={6} style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', border: `1px solid ${LINE}`, borderRadius: 8, padding: 8, background: '#fff', color: INK, marginBottom: 10, resize: 'vertical' }} />
                    <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 4 }}>Paste a snapshot to load it (writes to your rows):</div>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={3} placeholder='{"items":[...],"profile":{...}}' style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', border: `1px solid ${LINE}`, borderRadius: 8, padding: 8, background: '#fff', color: INK, marginBottom: 6, resize: 'vertical' }} />
                    <button onClick={devLoadSnapshot} style={devBtn}>Load snapshot</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
              <button onClick={onSignOut} className="flex items-center gap-1.5" style={{ fontSize: 13, color: MUTED, background: 'none', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}><LogOut size={14} /> Sign out</button>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: '#B4B0A6', marginTop: 26, textAlign: 'center' }}>prototype · live Claude calls · everything persists</div>
      </div>

      {/* ============ DETAIL / FULL VIEW ============ */}
      {detailId && (() => {
        const it = items.find(i => i.id === detailId); if (!it) return null;
        const p = projOf(it.project), en = ENERGY[it.energy] || ENERGY.admin;
        return (
          <div onClick={() => setDetailId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,40,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: PAPER, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
              <div className="flex items-start justify-between gap-3" style={{ marginBottom: 14 }}>
                <input value={it.title} onChange={e => setField(it.id, { title: e.target.value })} style={{ flex: 1, fontSize: 17, fontWeight: 600, border: 'none', outline: 'none', background: 'transparent', color: INK, fontFamily: 'inherit' }} />
                <button onClick={() => setDetailId(null)} style={iconBtn}><X size={16} /></button>
              </div>

              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: GREEN }}>{whenLabel(it)}</span>
                <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {it.minutes}m</span>
                <span style={{ fontSize: 11.5, color: en.color, background: tint(en.color), borderRadius: 999, padding: '1px 8px' }}>{en.label}</span>
                {it.deadline && <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><CalIcon size={12} /> {it.deadline}</span>}
                <span style={{ fontSize: 11.5, color: PRIO[it.priority], border: `1px solid ${PRIO[it.priority]}55`, borderRadius: 999, padding: '1px 8px' }}>{it.priority}</span>
              </div>

              {it.why && <div style={{ fontSize: 13.5, color: '#4A4860', marginBottom: 14, lineHeight: 1.55 }}>{it.why}</div>}

              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <FolderInput size={15} style={{ color: MUTED }} />
                <select value={it.project || 'personal'} onChange={e => setField(it.id, { project: e.target.value })} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: '6px 10px', fontSize: 13.5, background: CARD, color: INK, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {projectKeys.map(k => <option key={k} value={k}>{projOf(k).label}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><StickyNote size={13} /> Notes</div>
              <textarea value={it.notes || ''} onChange={e => setField(it.id, { notes: e.target.value })} rows={4} placeholder="jot anything — or let Sprekta break it down…" style={{ width: '100%', resize: 'vertical', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.55, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit', marginBottom: 12 }} />

              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
                <button onClick={() => breakDown(it)} disabled={busy} className="flex items-center gap-1.5" style={{ fontSize: 13, color: AI, background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}>{busy ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} Break it down</button>
                <button onClick={() => nudgeToChat(`Let's think through "${it.title}".${it.why ? ' ' + it.why : ''} How should I approach it?`)} className="flex items-center gap-1.5" style={{ fontSize: 13, color: AI, background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}><MessageSquarePlus size={13} /> Talk about this</button>
              </div>

              <div className="flex items-center gap-2" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
                <button onClick={() => complete(it.id)} className="flex items-center gap-1.5" style={{ fontSize: 13.5, fontWeight: 500, color: '#fff', background: GREEN, border: 'none', borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><Check size={15} /> Done</button>
                {it.today
                  ? <button onClick={() => { defer(it.id); }} className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: MUTED, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><ArrowDown size={15} /> Not today</button>
                  : <button onClick={() => { promote(it.id); }} className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: AI, background: CARD, border: `1px solid #DED9F6`, borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><ArrowUp size={15} /> Do today</button>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
