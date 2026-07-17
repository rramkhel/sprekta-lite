import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, Calendar as CalIcon, Check, Loader2, Trash2, ChevronRight, ChevronLeft, Sun, ArrowUp, ArrowDown, ArrowLeft, Plus, X, CalendarClock, MessageSquarePlus, Zap, AlertCircle, StickyNote, Wand2, FolderInput, LogOut, Bell } from 'lucide-react';
import { supabase } from './lib/supabaseClient.js';
import Onboarding, { WISHES } from './Onboarding.jsx';
import Capture from './Capture.jsx';
import { isIOS, isInstalled, isPromptDismissed, dismissPrompt, remindersEnabledOnThisDevice, enableReminders, sendTestNotification } from './lib/push.js';
import {
  pad, ymd, todayYMD, addDays, nowStr, uid,
  callClaude, grabJSON, splitReplyAndJSON, offloadSystemPrompt, prepareParsedItems, mergeItems,
  itemDay, whenLabel, persistNewItems, insertAllItems, replaceAllItems, persistQuestions,
} from './lib/parse.js';

const INK = '#22223B', PAPER = '#FAF9F6', CARD = '#FFFFFF', LINE = '#E7E4DC';
const GREEN = '#12886A', AI = '#0F6E56', MUTED = '#77748A';
const ENERGY = { deep: { label: 'deep', color: '#0F6E56' }, admin: { label: 'admin', color: '#5B7085' }, physical: { label: 'physical', color: '#C77D2E' } };
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
  displayName: '',
  wishes: [],
  challenge: '',
  onboardingAnswers: {},
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const SAMPLE_ITEMS = [
  { title: 'Send wedding invites', kind: 'task', minutes: 60, deadline: addDays(1), energy: 'admin', priority: 'high', project: 'personal', today: true, why: 'Goes out tomorrow — the anchor everything else waits on.' },
  { title: 'Book meeting with Andrea', kind: 'task', minutes: 10, deadline: null, energy: 'admin', priority: 'med', project: 'personal', suggested_slot: 'slump · call' },
  { title: 'Sprekta deep-work block', kind: 'task', minutes: 120, deadline: null, energy: 'deep', priority: 'med', project: 'personal', today: true, why: 'Protecting the goal work before the week fills up.' },
  { title: 'Groceries', kind: 'errand', minutes: 45, deadline: addDays(2), energy: 'physical', priority: 'low', project: 'personal', suggested_slot: 'slump' },
];

export default function Sprekta({ session, onSignOut }) {
  const [view, setView] = useState('capture');
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(SEED_PROFILE);
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
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);
  const [reminderStatus, setReminderStatus] = useState('');
  const [testNotifStatus, setTestNotifStatus] = useState('');
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
          displayName: profileRow.display_name || '',
          wishes: profileRow.wishes || [],
          challenge: profileRow.challenge || '',
          onboardingAnswers: profileRow.onboarding_answers || {},
        });
      } else {
        await supabase.from('profiles').insert({
          user_id: userId,
          rhythm: SEED_PROFILE.rhythm,
          defaults: SEED_PROFILE.defaults,
          learned: SEED_PROFILE.learned,
          facts: SEED_PROFILE.facts,
          priorities: SEED_PROFILE.priorities,
          situations: SEED_PROFILE.situations,
          onboarded: SEED_PROFILE.onboarded,
          projects: SEED_PROFILE.projects,
          display_name: SEED_PROFILE.displayName,
          wishes: SEED_PROFILE.wishes,
          challenge: SEED_PROFILE.challenge,
          onboarding_answers: SEED_PROFILE.onboardingAnswers,
        });
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
        display_name: profile.displayName,
        wishes: profile.wishes,
        challenge: profile.challenge,
        onboarding_answers: profile.onboardingAnswers,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [profile, loaded, userId]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, busy]);
  useEffect(() => { const el = chatBox.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 74) + 'px'; } }, [chatInput, chatOpen]);
  useEffect(() => { if (chatOpen) chatBox.current?.focus(); }, [chatOpen]);
  // auto-detect new projects the model invents
  useEffect(() => {
    const known = profile.projects || {};
    const missing = [...new Set(items.map(i => i.project).filter(Boolean))].filter(k => !known[k]);
    if (missing.length) {
      setProfile(p => { const proj = { ...(p.projects || {}) }; missing.forEach((k) => { proj[k] = { label: labelize(k), color: PALETTE[Object.keys(proj).length % PALETTE.length] }; }); return { ...p, projects: proj }; });
      setJustDetected(missing);
    }
  }, [items]);
  useEffect(() => { if (loaded && !profile.onboarded && items.length === 0) setShowOnboarding(true); }, [loaded]);

  function debouncedItemUpdate(id, patch) {
    clearTimeout(itemWriteTimers.current[id]);
    itemWriteTimers.current[id] = setTimeout(() => {
      supabase.from('items').update(patch).eq('id', id).then(() => {});
    }, 600);
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
        const merged = mergeItems(items, prepareParsedItems(data.items));
        setItems(merged);
        const withIds = await persistNewItems(merged, items, userId);
        setItems(withIds);
        maybeOfferReminders(withIds);
      }
    } catch { setChat(c => [...c, { role: 'assistant', content: 'Hit a snag — mind resending?' }]); }
    setBusy(false);
  }
  function nudgeToChat(seed) { setDetailId(null); setView('plan'); setChatOpen(true); sendChat(seed); }

  // Offers the reminder-permission prompt the first time a timed item lands
  // on a device that hasn't enabled reminders and hasn't dismissed the ask —
  // never on page load, only as a reaction to something the user just did.
  function maybeOfferReminders(newlyCreatedItems) {
    if (remindersEnabledOnThisDevice() || isPromptDismissed()) return;
    if ((newlyCreatedItems || []).some((i) => i.fixed_time)) setShowReminderPrompt(true);
  }
  async function handleEnableReminders() {
    setReminderStatus('working');
    const result = await enableReminders({ accessToken });
    setReminderStatus(result.status);
    if (result.status === 'enabled') setShowReminderPrompt(false);
  }
  function handleDismissReminderPrompt() {
    dismissPrompt();
    setShowReminderPrompt(false);
  }

  // ---- onboarding ----
  // Called once, from Onboarding's "See my week" CTA. Derives the app's
  // existing profile fields (rhythm/facts/situations) from the raw answers,
  // persists everything, and runs the real parse pipeline on their first
  // "what's coming up this week" dump so they land in Today with a real plan.
  async function finishOnboarding(answers) {
    const {
      name, jobTitle, jobType, jobVaries, weekday, weekend, anchors, gridCells,
      resp, protect, protectNote, challenge, wishes, loves, nonos, lifeBig,
      people, peopleNote, rides, rideOther, tomorrow,
    } = answers;

    const rhythmLines = [];
    if (weekday.trim()) rhythmLines.push('Weekdays: ' + weekday.trim());
    if (weekend.trim()) rhythmLines.push('Weekends: ' + weekend.trim());
    const fixedCount = Object.keys(gridCells).length;
    if (fixedCount) {
      const label = anchors.trim() ? ` — ${anchors.trim()}` : '';
      rhythmLines.push(`Fixed weekly commitments (${fixedCount} slot${fixedCount === 1 ? '' : 's'})${label}`);
    }

    const factLines = [];
    const work = jobTitle.trim() || (jobType === 'It varies' && jobVaries.trim() ? `Work varies — ${jobVaries.trim()}` : jobType);
    if (work) factLines.push('Work: ' + work);
    if (resp.trim()) factLines.push('Keeping track of: ' + resp.trim());
    if (protect.length || protectNote.trim()) {
      const all = [...protect, ...(protectNote.trim() ? [protectNote.trim()] : [])];
      factLines.push('Wants regular time for: ' + all.join(', '));
    }
    if (loves.trim()) factLines.push('Into: ' + loves.trim());
    if (nonos.trim()) factLines.push('Non-negotiables: ' + nonos.trim());
    if (people.length) {
      const peopleAll = [...people.filter(p => p !== 'Just me'), ...(peopleNote.trim() ? [peopleNote.trim()] : [])];
      factLines.push(people.includes('Just me') && !peopleAll.length ? 'Day to day: just themself' : 'Day to day: ' + peopleAll.join(', '));
    }
    if (rides.length) {
      const rideAll = [...rides.filter(r => r !== 'Other'), ...(rides.includes('Other') && rideOther.trim() ? [rideOther.trim()] : [])];
      factLines.push('Gets around by: ' + rideAll.join(', '));
    }

    const situationsArr = [];
    if (lifeBig.trim()) situationsArr.push({ raw: lifeBig.trim(), scope: 'season' });

    const newProfile = {
      ...profile,
      rhythm: rhythmLines,
      facts: factLines,
      situations: situationsArr,
      wishes,
      challenge: challenge.trim(),
      displayName: name.trim(),
      onboardingAnswers: answers,
      onboarded: true,
    };
    setProfile(newProfile);

    await supabase.from('profiles').upsert({
      user_id: userId,
      rhythm: newProfile.rhythm,
      defaults: newProfile.defaults,
      learned: newProfile.learned,
      facts: newProfile.facts,
      priorities: newProfile.priorities,
      situations: newProfile.situations,
      onboarded: true,
      projects: newProfile.projects,
      display_name: newProfile.displayName,
      wishes: newProfile.wishes,
      challenge: newProfile.challenge,
      onboarding_answers: newProfile.onboardingAnswers,
      updated_at: new Date().toISOString(),
    });

    if (tomorrow.trim()) {
      setBusy(true);
      try {
        const system = offloadSystemPrompt(newProfile, projects);
        const parsed = grabJSON(await callClaude({ system, messages: [{ role: 'user', content: tomorrow }], accessToken }));
        const its = prepareParsedItems(parsed.items).map(x => ({ ...x, id: uid() }));
        const inserted = await insertAllItems(its, userId);
        await supabase.from('dumps').insert({ user_id: userId, raw_text: tomorrow });
        setItems(inserted);
        setRead(parsed.read || '');
        maybeOfferReminders(inserted);
      } catch { setErr('Had trouble building your first plan — try Offload again from Plan.'); }
      setBusy(false);
    }

    setShowOnboarding(false);
    setView('today');
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
  async function devResetToBlank() {
    if (!window.confirm('Reset your profile to blank and clear all items?')) return;
    setItems([]); setRead(''); setJustDetected([]);
    setProfile(SEED_PROFILE);
    await supabase.from('items').delete().eq('user_id', userId);
  }
  async function devSaveProfile() {
    const defaultName = `snapshot ${new Date().toLocaleString()}`;
    const name = window.prompt('Name this snapshot:', defaultName);
    if (!name) return;
    await supabase.from('profile_snapshots').insert({ user_id: userId, name, profile });
    if (showSnapshots) await devRefreshSnapshots();
  }
  async function devRefreshSnapshots() {
    const { data } = await supabase.from('profile_snapshots').select('id,name,created_at').eq('user_id', userId).order('created_at', { ascending: false });
    setSnapshots(data || []);
  }
  async function devToggleSnapshots() {
    const next = !showSnapshots;
    setShowSnapshots(next);
    if (next) await devRefreshSnapshots();
  }
  async function devApplySnapshot(snap) {
    if (!window.confirm(`Load "${snap.name}"? This overwrites your current profile.`)) return;
    const { data } = await supabase.from('profile_snapshots').select('profile').eq('id', snap.id).single();
    if (data) setProfile({ ...SEED_PROFILE, ...data.profile });
  }
  async function devDeleteSnapshot(id) {
    if (!window.confirm('Delete this snapshot?')) return;
    await supabase.from('profile_snapshots').delete().eq('id', id);
    devRefreshSnapshots();
  }
  async function devLoadSample() {
    const inserted = await replaceAllItems(SAMPLE_ITEMS, userId);
    setItems(inserted);
  }
  async function devImportRawState() {
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
    setShowOnboarding(true);
  }
  async function devSendTestNotification() {
    setTestNotifStatus('sending');
    const ok = await sendTestNotification({ accessToken });
    setTestNotifStatus(ok ? 'sent' : 'no-subscription');
    setTimeout(() => setTestNotifStatus(''), 4000);
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
  const Tab = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', fontSize: 14, fontWeight: view === id ? 600 : 500, color: view === id ? '#1D1B17' : '#B5AFA2', borderBottom: `2px solid ${view === id ? '#0F6E56' : 'transparent'}` }}>
      {label}
    </button>
  );

  if (showOnboarding) return <Onboarding onFinish={finishOnboarding} />;

  return (
    <div style={{ background: PAPER, color: INK, minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'max(22px, env(safe-area-inset-top)) 18px 40px' }}>

        <div style={{ marginBottom: 16, borderBottom: `1px solid ${LINE}`, paddingBottom: 11 }}>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 9 }}>Sprekta<span style={{ color: '#0F6E56' }}>.</span></div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <Tab id="capture" label="Capture" />
            <Tab id="today" label="Today" />
            <Tab id="plan" label="Plan" />
            <Tab id="calendar" label="Calendar" />
            <Tab id="settings" label="Settings" />
          </div>
        </div>

        {showReminderPrompt && (
          <div style={{ background: '#EAF3EE', border: '1px solid #D3E6DC', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div className="flex items-center gap-2" style={{ fontSize: 13.5, fontWeight: 600, color: AI, marginBottom: 6 }}><Bell size={15} /> Want a nudge before this starts?</div>
            {reminderStatus === 'needs-install' && <div style={{ fontSize: 13, color: '#5A5878', lineHeight: 1.5, marginBottom: 8 }}>On iPhone, reminders need Sprekta added to your home screen first — tap Share, then "Add to Home Screen," then open it from there and try again.</div>}
            {reminderStatus === 'denied' && <div style={{ fontSize: 13, color: '#5A5878', marginBottom: 8 }}>Notifications are blocked for this site — turn them on in your browser's site settings, then try again.</div>}
            {reminderStatus === 'unsupported' && <div style={{ fontSize: 13, color: '#5A5878', marginBottom: 8 }}>This browser doesn't support reminders.</div>}
            {reminderStatus === 'error' && <div style={{ fontSize: 13, color: '#5A5878', marginBottom: 8 }}>Couldn't turn reminders on — you can try again from Settings.</div>}
            <div className="flex items-center gap-2">
              {!['needs-install', 'denied', 'unsupported'].includes(reminderStatus) && (
                <button onClick={handleEnableReminders} disabled={reminderStatus === 'working'} style={{ fontSize: 13, fontWeight: 500, color: '#fff', background: reminderStatus === 'working' ? '#B5AFA2' : AI, border: 'none', borderRadius: 10, padding: '7px 14px', cursor: reminderStatus === 'working' ? 'default' : 'pointer' }}>{reminderStatus === 'working' ? 'Turning on…' : 'Enable reminders'}</button>
              )}
              <button onClick={handleDismissReminderPrompt} style={{ fontSize: 13, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>Not now</button>
            </div>
          </div>
        )}

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
                style={{ width: '100%', textAlign: 'left', background: '#EAF3EE', border: '1px solid #D3E6DC', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
                <div className="flex items-center gap-2" style={{ fontSize: 13.5, fontWeight: 600, color: AI, marginBottom: 3 }}><MessageSquarePlus size={15} /> Think it through with me</div>
                <div style={{ fontSize: 13, color: '#5A5878', lineHeight: 1.5 }}>Want to talk through the order before the week starts?</div>
              </button>
            )}
          </div>
        )}

        {/* ============ CAPTURE ============ */}
        {view === 'capture' && (
          <Capture profile={profile} projects={projects} userId={userId} accessToken={accessToken} onAfterCapture={maybeOfferReminders} />
        )}

        {/* ============ PLAN ============ */}
        {view === 'plan' && (
          <div>
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
                    <button key={idx} onClick={() => setSelDay(ds)} style={{ minHeight: 44, borderRadius: 9, cursor: 'pointer', padding: '4px 0 3px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: isSel ? '#EAF3EE' : CARD, border: `1px solid ${isSel ? AI : LINE}` }}>
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

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 4px' }}>Where planning breaks down</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>The part that keeps tripping you up — the first thing I work on.</div>
            <textarea value={profile.challenge || ''} onChange={e => setProfile(p => ({ ...p, challenge: e.target.value }))} rows={2} placeholder="e.g. everything piles onto one day" style={{ width: '100%', resize: 'vertical', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', fontSize: 13.5, lineHeight: 1.5, outline: 'none', background: CARD, color: INK, fontFamily: 'inherit', marginBottom: 16 }} />

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '0 0 4px' }}>Where I can help most</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>Tap any that fit — this shapes how I handle your time.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 6 }}>
              {WISHES.map(w => {
                const on = (profile.wishes || []).includes(w.key);
                return (
                  <button key={w.key} onClick={() => setProfile(p => ({ ...p, wishes: (p.wishes || []).includes(w.key) ? p.wishes.filter(x => x !== w.key) : [...(p.wishes || []), w.key] }))}
                    style={{ textAlign: 'left', padding: '9px 11px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${on ? w.color : LINE}`, background: on ? w.color + '14' : CARD }}>
                    <div className="flex items-center justify-between" style={{ gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: on ? w.color : INK }}>{w.label}</span>
                      {on && <Check size={13} style={{ color: w.color, flexShrink: 0 }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ background: '#F4F3F0', border: `1px dashed ${LINE}`, borderRadius: 12, padding: 14, marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 4 }}>Behavioural profile — coming later</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>The deeper read: what you actually do vs. plan. Learned quietly from use.</div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: AI, margin: '20px 0 8px' }}>Reminders</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>A nudge 15 minutes before something with a set time — only on this device.</div>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <button onClick={handleEnableReminders} disabled={reminderStatus === 'working'} className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 500, color: '#fff', background: reminderStatus === 'working' ? '#B5AFA2' : AI, border: 'none', borderRadius: 10, padding: '8px 14px', cursor: reminderStatus === 'working' ? 'default' : 'pointer' }}><Bell size={14} /> {reminderStatus === 'working' ? 'Turning on…' : reminderStatus === 'enabled' ? 'Reminders on' : 'Enable reminders'}</button>
            </div>
            {reminderStatus === 'needs-install' && <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>On iPhone, add Sprekta to your home screen first (Share → Add to Home Screen), then open it from there and try again.</div>}
            {reminderStatus === 'denied' && <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>Notifications are blocked for this site — turn them on in your browser's site settings.</div>}
            {reminderStatus === 'unsupported' && <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>This browser doesn't support reminders.</div>}
            {reminderStatus === 'error' && <div style={{ fontSize: 12.5, color: '#B23', marginBottom: 8 }}>Couldn't turn reminders on — try again.</div>}

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
                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: (showSnapshots || showRaw) ? 12 : 0 }}>
                  <button onClick={devSaveProfile} style={devBtn}>Save profile</button>
                  <button onClick={devToggleSnapshots} style={devBtn}>{showSnapshots ? 'Hide' : 'Load'} profile</button>
                  <button onClick={devResetToBlank} style={devBtn}>Reset to blank</button>
                  <button onClick={devLoadSample} style={devBtn}>Load sample tasks</button>
                  <button onClick={devRunOnboarding} style={devBtn}>Run onboarding</button>
                  <button onClick={devSendTestNotification} style={devBtn}>{testNotifStatus === 'sending' ? 'Sending…' : 'Send test notification'}</button>
                  <button onClick={() => setShowRaw(s => !s)} style={devBtn}>{showRaw ? 'Hide' : 'Show'} raw state</button>
                </div>
                {testNotifStatus && testNotifStatus !== 'sending' && <div style={{ fontSize: 12, color: testNotifStatus === 'sent' ? GREEN : '#B23', marginBottom: 8 }}>{testNotifStatus === 'sent' ? 'Sent — check your notifications.' : 'No subscription for this device yet — enable reminders first.'}</div>}

                {showSnapshots && (
                  <div style={{ marginBottom: showRaw ? 12 : 0 }}>
                    {snapshots.length === 0
                      ? <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>No saved snapshots yet.</div>
                      : <div className="flex flex-col gap-1.5" style={{ marginBottom: 8 }}>
                          {snapshots.map(s => (
                            <div key={s.id} className="flex items-center gap-2" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 9px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: MUTED }}>{new Date(s.created_at).toLocaleString()}</div>
                              </div>
                              <button onClick={() => devApplySnapshot(s)} style={devBtn}>Load</button>
                              <button onClick={() => devDeleteSnapshot(s.id)} style={iconBtn}><X size={13} /></button>
                            </div>
                          ))}
                        </div>}
                  </div>
                )}

                {showRaw && (
                  <div>
                    <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 4 }}>Current state — copy to save elsewhere:</div>
                    <textarea readOnly value={JSON.stringify({ items, profile }, null, 2)} rows={6} style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', border: `1px solid ${LINE}`, borderRadius: 8, padding: 8, background: '#fff', color: INK, marginBottom: 10, resize: 'vertical' }} />
                    <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 4 }}>Paste a JSON blob to import it (writes to your rows):</div>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={3} placeholder='{"items":[...],"profile":{...}}' style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', border: `1px solid ${LINE}`, borderRadius: 8, padding: 8, background: '#fff', color: INK, marginBottom: 6, resize: 'vertical' }} />
                    <button onClick={devImportRawState} style={devBtn}>Import state</button>
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
                <button onClick={() => breakDown(it)} disabled={busy} className="flex items-center gap-1.5" style={{ fontSize: 13, color: AI, background: '#EAF3EE', border: '1px solid #D3E6DC', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}>{busy ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} Break it down</button>
                <button onClick={() => nudgeToChat(`Let's think through "${it.title}".${it.why ? ' ' + it.why : ''} How should I approach it?`)} className="flex items-center gap-1.5" style={{ fontSize: 13, color: AI, background: '#EAF3EE', border: '1px solid #D3E6DC', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}><MessageSquarePlus size={13} /> Talk about this</button>
              </div>

              <div className="flex items-center gap-2" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
                <button onClick={() => complete(it.id)} className="flex items-center gap-1.5" style={{ fontSize: 13.5, fontWeight: 500, color: '#fff', background: GREEN, border: 'none', borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><Check size={15} /> Done</button>
                {it.today
                  ? <button onClick={() => { defer(it.id); }} className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: MUTED, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><ArrowDown size={15} /> Not today</button>
                  : <button onClick={() => { promote(it.id); }} className="flex items-center gap-1.5" style={{ fontSize: 13.5, color: AI, background: CARD, border: `1px solid #D3E6DC`, borderRadius: 10, padding: '9px 15px', cursor: 'pointer' }}><ArrowUp size={15} /> Do today</button>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ THINK IT THROUGH — full-screen, like a fresh chat ============ */}
      {chatOpen && (
        <div style={{ position: 'fixed', inset: 0, background: PAPER, zIndex: 60, display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3" style={{ padding: 'max(14px, env(safe-area-inset-top)) 16px 14px', borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
            <button onClick={() => setChatOpen(false)} aria-label="Back" style={iconBtn}><ArrowLeft size={16} /></button>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Think it through</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            {chat.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%', fontSize: 14, lineHeight: 1.55, padding: '9px 13px', borderRadius: 14, background: m.role === 'user' ? INK : '#EAF3EE', color: m.role === 'user' ? '#fff' : INK, whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            ))}
            {busy && <div style={{ fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" /> thinking…</div>}
            <div ref={chatEnd} />
          </div>
          <div className="flex items-end gap-2" style={{ padding: '12px 16px max(12px, env(safe-area-inset-bottom))', borderTop: `1px solid ${LINE}`, background: CARD, flexShrink: 0 }}>
            <textarea ref={chatBox} value={chatInput} rows={1} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="talk it through…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 12px', fontSize: 14, lineHeight: 1.5, outline: 'none', color: INK, fontFamily: 'inherit', resize: 'none', maxHeight: 74, overflowY: 'auto' }} />
            <button onClick={() => sendChat()} disabled={busy || !chatInput.trim()} style={{ background: (busy || !chatInput.trim()) ? '#B5AFA2' : AI, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: (busy || !chatInput.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}><ArrowUp size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
