import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowUp, Loader2, Inbox, Calendar as CalIcon, Bell, Flag, MessageCircle, Trash2,
  ChevronDown, ChevronUp, Square, ArrowLeft, X, RotateCcw, Check,
} from 'lucide-react';
import { supabase } from './lib/supabaseClient.js';
import {
  offloadSystemPrompt, prepareParsedItems, callClaude, grabJSON,
  persistQuestions, applyCorrection, undoCorrection, whenLabel,
} from './lib/parse.js';

// Laurel palette — shared with the Activity mockup (sprekta-capture-valet.html).
// One accent total; held/uncertain states stay neutral (STONE/FAINT), never
// red or yellow — per design doc §11, uncertainty is normal, not an error.
const PAPER = '#FBFAF7', INK = '#1D1B17', STONE = '#8D877B', FAINT = '#B5AFA2',
      HAIR = '#E7E3DA', LINE = '#F1EDE4', CARD = '#FFFFFF',
      ACC = '#0F6E56', ACC_DEEP = '#0C5A47', ACC_SOFT = '#EAF3EE', ACC_LINE = '#D3E6DC',
      RING = '#BBB4A6', FLAG = '#B07A1E';
const SERIF = "'Fraunces', Georgia, serif";

const OFFSET_LABEL = (m) => (m % 10080 === 0 ? `${m / 10080}w` : m % 1440 === 0 ? `${m / 1440}d` : `${m}m`);

const chip = { fontSize: 12.5, fontWeight: 600, color: ACC_DEEP, background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 999, padding: '5px 12px', cursor: 'pointer' };
const ricon = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center' };

function relTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Marker says what the item became — destination only, never a question
// tier. Held items (status='parked', either reason) get the open ring;
// everything else is read off kind/fixed_time. See heldStatusLine for the
// two held reasons' distinct copy.
function Marker({ item, size = 13 }) {
  if (item.status === 'done') {
    return (
      <span style={{ width: size + 2, height: size + 2, borderRadius: 5, background: ACC, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Check size={size - 4} style={{ color: '#fff' }} strokeWidth={3} />
      </span>
    );
  }
  if (item.status === 'parked') {
    return <span style={{ width: size - 2, height: size - 2, borderRadius: 999, border: `1.5px solid ${RING}`, flexShrink: 0, display: 'inline-block' }} />;
  }
  if (item.fixed_time) return <CalIcon size={size} className="sprekta-marker-glyph" style={{ color: ACC, flexShrink: 0 }} />;
  return <Square size={size} className="sprekta-marker-glyph" style={{ color: ACC, flexShrink: 0 }} />;
}

// Todo/calendar items are checkable off any marker (design-doc §7.1
// amendment); parked/resting rings are not — ambiguity and readiness
// aren't the user's to resolve by tapping a glyph.
function isCheckable(item) {
  return item.status === 'open' || item.status === 'done';
}

// Ambiguity is the system's problem (clarify); readiness is the user's
// prerogative (rest). Same open-ring marker, different owner and different
// fixed-grammar line — never derived from a question's tier.
function heldStatusLine(item) {
  if (item.status !== 'parked') return null;
  return item.parked_reason === 'rest' ? 'resting · back in a day or two' : 'needs clarification · this evening';
}

function factsFor(item) {
  const facts = [];
  if (item.flagged) facts.push({ icon: <Flag size={11} />, text: 'priority', flag: true });
  if (item.fixed_time) {
    const d = new Date(item.fixed_time);
    const days = Math.round((d - new Date()) / 86400000);
    const when = days >= 0 && days < 7
      ? d.toLocaleDateString([], { weekday: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'due ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    facts.push({ icon: <CalIcon size={11} />, text: when });
  } else if (item.deadline) {
    facts.push({ icon: <CalIcon size={11} />, text: 'due ' + item.deadline });
  }
  if (item.quiet) {
    facts.push({ icon: <Bell size={11} />, text: 'quiet' });
  } else if ((item.fixed_time || item.deadline) && (item.reminder_offsets || []).length) {
    facts.push({ icon: <Bell size={11} />, text: item.reminder_offsets.map(OFFSET_LABEL).join(' + ') });
  }
  return facts;
}

// icon + info, middot-joined, wrapping only at fact boundaries — never a
// bare flex gap (that wraps mid-fact and reads as a metadata dump).
function FactsLine({ facts }) {
  if (!facts.length) return null;
  return (
    <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 3 }}>
      {facts.map((f, i) => (
        <span key={i} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', color: f.flag ? FLAG : ACC_DEEP }}>
          {i > 0 && <span style={{ margin: '0 8px', color: FAINT, fontWeight: 400 }}>·</span>}
          <span style={{ marginRight: 4, display: 'inline-flex' }}>{f.icon}</span>{f.text}
        </span>
      ))}
    </div>
  );
}

function entrySummary(items) {
  const first = items[0];
  const more = items.length - 1;
  const scheduled = items.filter(i => i.fixed_time && i.status !== 'done').length;
  const todos = items.filter(i => !i.fixed_time && i.status === 'open').length;
  const resting = items.filter(i => i.status === 'parked' && i.parked_reason === 'rest').length;
  const clarify = items.filter(i => i.status === 'parked' && i.parked_reason === 'clarify').length;
  const done = items.filter(i => i.status === 'done').length;
  const flagged = items.filter(i => i.flagged).length;
  const parts = [];
  if (flagged) parts.push({ text: `⚑ ${flagged} flagged`, sched: true });
  if (scheduled) parts.push({ text: `${scheduled} scheduled`, sched: true });
  if (todos) parts.push({ text: `${todos} todo${todos > 1 ? 's' : ''}` });
  if (resting) parts.push({ text: `${resting} resting` });
  if (clarify) parts.push({ text: `${clarify} for later` });
  if (done) parts.push({ text: `${done} done` });
  return { first, more, parts };
}

// The single-row vs. card+summary form is decided by how many items the
// dump originally parsed to, not how many currently survive — a 3-item
// capture reduced to 1 surviving item (2 archived) still means its
// "You said" footer and undo-this-dump are talking about three lines, not
// one. dump.item_count is frozen at capture time (migration 0010); older
// dumps that predate it fall back to the current surviving count.
function originalItemCount(dump, items) {
  return dump.item_count ?? items.length;
}

function MetaLine({ parts }) {
  if (!parts.length) return null;
  return (
    <div style={{ fontSize: 12, color: FAINT, marginTop: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.sched ? ACC_DEEP : FAINT, fontWeight: p.sched ? 500 : 400 }}>
          {i > 0 && <span style={{ margin: '0 6px', color: FAINT }}>·</span>}{p.text}
        </span>
      ))}
    </div>
  );
}

// The Capture tab — the app's one intake surface. Composer + a feed of past
// captures ("entries"), each grouped by the dump that produced it.
// v1 subset of sprekta-capture-design-doc.md / sprekta-capture-valet.html —
// no voice, no torn/flip UI, no project/saved-fact verbs, no point-of-use
// correction, no Activity link yet (Activity tab doesn't exist to open into).
export default function Capture({ profile, projects, userId, accessToken, onAfterCapture }) {
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [focusItem, setFocusItem] = useState(null); // { id, title, clarify?, placeholder? }
  const [ceaLine, setCeaLine] = useState(null); // { text, onUndo? }
  const [entries, setEntries] = useState([]); // [{ dump, items }]
  const [questionsByItem, setQuestionsByItem] = useState(new Map());
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [rawOpenIds, setRawOpenIds] = useState(() => new Set());
  const [openItemId, setOpenItemId] = useState(null);
  const [sayText, setSayText] = useState('');
  const [saySending, setSaySending] = useState(false);
  const [sayClarify, setSayClarify] = useState(null);
  const [err, setErr] = useState('');
  const [pendingEntry, setPendingEntry] = useState(null); // { text, failed }
  const [freshEntryId, setFreshEntryId] = useState(null);
  const ceaTimer = useRef(null);
  const sayInputRef = useRef(null);
  const allQuestionsRef = useRef([]);

  // Only auto-expands the newest entry when explicitly asked to (right
  // after a fresh capture) — never on a plain refresh, or collapse-all
  // silently undoes itself after any unrelated correction (P2-9).
  const load = useCallback(async (opts = {}) => {
    const [{ data: dumps }, { data: items }, { data: qs }] = await Promise.all([
      supabase.from('dumps').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('items').select('*').eq('user_id', userId).neq('status', 'archived').order('created_at', { ascending: true }),
      supabase.from('questions').select('*').eq('user_id', userId),
    ]);
    const byDump = new Map();
    (items || []).forEach((it) => {
      if (!it.dump_id) return;
      if (!byDump.has(it.dump_id)) byDump.set(it.dump_id, []);
      byDump.get(it.dump_id).push(it);
    });
    const list = (dumps || []).map(d => ({ dump: d, items: byDump.get(d.id) || [] })).filter(e => e.items.length);
    setEntries(list);
    if (opts.expandNewest) setExpandedIds(prev => new Set(prev).add(opts.expandNewest));
    const byItem = new Map();
    (qs || []).forEach((q) => {
      if (!q.item_id || q.status !== 'open') return;
      if (!byItem.has(q.item_id)) byItem.set(q.item_id, []);
      byItem.get(q.item_id).push(q);
    });
    setQuestionsByItem(byItem);
    return qs || [];
  }, [userId]);

  useEffect(() => { load().then((qs) => { allQuestionsRef.current = qs; }); }, [load]);
  useEffect(() => {
    if (!freshEntryId) return;
    const t = setTimeout(() => setFreshEntryId(null), 2000);
    return () => clearTimeout(t);
  }, [freshEntryId]);
  useEffect(() => { setSayText(''); setSayClarify(null); }, [openItemId]);

  function toggleEntry(id) {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleRaw(id) {
    setRawOpenIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  const collapseAll = () => setExpandedIds(new Set());

  function showConfirmation(result) {
    clearTimeout(ceaTimer.current);
    setCeaLine({
      text: result.confirmation,
      onUndo: async () => {
        await undoCorrection({ itemId: result.itemId, before: result.before });
        setCeaLine(null);
        await load();
      },
    });
    ceaTimer.current = setTimeout(() => setCeaLine(null), 9000);
  }

  // Answering here should clear the Activity question too — one queue,
  // two doors. Marks every open question on the item, not just tier-1
  // facts: a say-box correction is the user directly addressing the item,
  // which resolves whatever was outstanding on it.
  async function markItemQuestionsAnswered(itemId, answerText) {
    const openQs = allQuestionsRef.current.filter(q => q.item_id === itemId && q.status === 'open');
    if (!openQs.length) return;
    await supabase.from('questions').update({ status: 'answered', answer: answerText, answered_at: new Date().toISOString() }).in('id', openQs.map(q => q.id));
  }

  function findItem(id) {
    for (const e of entries) { const it = e.items.find(i => i.id === id); if (it) return it; }
    return null;
  }

  async function runCapture(text) {
    const askedQuestions = allQuestionsRef.current.map(q => q.text);
    const system = offloadSystemPrompt(profile, projects, { askedQuestions });
    const parsed = grabJSON(await callClaude({ system, messages: [{ role: 'user', content: text }], accessToken }));
    const prepared = prepareParsedItems(parsed.items || []).map(it => ({ ...it, source: it.source || text }));
    // item_count freezes the parsed count so a single-item entry's bare-row
    // form (or a multi-item entry's card+footer form) doesn't flip-flop
    // later as items get archived — see migration 0010.
    const { data: dumpRow } = await supabase.from('dumps').insert({ user_id: userId, raw_text: text, item_count: prepared.length }).select().single();
    const rows = prepared.map(({ id, ...rest }) => ({ ...rest, user_id: userId, dump_id: dumpRow?.id || null }));
    const { data: inserted } = rows.length ? await supabase.from('items').insert(rows).select() : { data: [] };
    const insertedQuestions = (Array.isArray(parsed.questions) && parsed.questions.length && inserted?.length)
      ? await persistQuestions(parsed.questions, inserted, parsed.items, userId)
      : [];
    // Tier 3 = genuinely vague, the system cannot responsibly form a task
    // (design doc §5.3) — that item is held as "clarify", distinct from a
    // well-formed item the user later rests themselves.
    const parkIds = insertedQuestions.filter(q => q.tier === 3 && q.item_id).map(q => q.item_id);
    if (parkIds.length) {
      await supabase.from('items').update({ status: 'parked', parked_reason: 'clarify' }).in('id', parkIds);
    }
    if (onAfterCapture && inserted?.length) onAfterCapture(inserted);
    await load({ expandNewest: dumpRow?.id });
    return dumpRow?.id || null;
  }

  async function retryPending() {
    if (!pendingEntry) return;
    const text = pendingEntry.text;
    setPendingEntry({ text, failed: false });
    try {
      const dumpId = await runCapture(text);
      setFreshEntryId(dumpId);
      setPendingEntry(null);
    } catch { setPendingEntry({ text, failed: true }); }
  }

  async function send() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true); setErr('');
    if (focusItem) {
      try {
        const item = findItem(focusItem.id);
        if (!item) { setErr('Couldn’t find that item anymore.'); setFocusItem(null); }
        else {
          const result = await applyCorrection({ item, utterance: text, profile, userId, accessToken, surface: 'capture_composer' });
          if (result.kind === 'clarify') {
            setFocusItem({ ...focusItem, clarify: result.clarify, placeholder: result.placeholder });
            setComposerText('');
          } else {
            await markItemQuestionsAnswered(focusItem.id, result.confirmation);
            showConfirmation(result);
            setFocusItem(null);
            setComposerText('');
            await load();
          }
        }
      } catch { setErr('That didn’t land — try again.'); }
      setSending(false);
      return;
    }
    // The words are safe the instant we clear the box; only the
    // interpretation still has to load (design doc §4 — safety is
    // unconditional and immediate).
    setComposerText('');
    setPendingEntry({ text, failed: false });
    try {
      const dumpId = await runCapture(text);
      setFreshEntryId(dumpId);
      setPendingEntry(null);
    } catch { setPendingEntry({ text, failed: true }); }
    setSending(false);
  }

  // Users complete items wherever they see them — the old "checking off
  // happens on Today" rule only ever constrained Sprekta, not the user
  // (design-doc §7.1 amendment). Row stays in the feed either way; done is
  // a status, never a delete, same as everywhere else in this schema.
  async function toggleDone(item) {
    const wasDone = item.status === 'done';
    const before = { status: item.status };
    const after = { status: wasDone ? 'open' : 'done' };
    await supabase.from('items').update(after).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: wasDone ? 'reopen' : 'close', before, after, surface: 'capture' });
    clearTimeout(ceaTimer.current);
    setCeaLine({
      text: wasDone ? `Reopened ${item.title}.` : `Done — ${item.title}.`,
      onUndo: async () => {
        await supabase.from('items').update(before).eq('id', item.id);
        setCeaLine(null);
        await load();
      },
    });
    ceaTimer.current = setTimeout(() => setCeaLine(null), 9000);
    await load();
  }
  async function toggleFlag(item) {
    const flagged = !item.flagged;
    await supabase.from('items').update({ flagged }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: flagged ? 'flag' : 'unflag', before: { flagged: item.flagged }, after: { flagged }, surface: 'item_view' });
    await load();
  }
  async function toggleToday(item) {
    const today = !item.today;
    await supabase.from('items').update({ today }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'promote_today', before: { today: item.today }, after: { today }, surface: 'item_view' });
    await load();
  }
  async function toggleQuiet(item) {
    const quiet = !item.quiet;
    await supabase.from('items').update({ quiet }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'edit_field', before: { quiet: item.quiet }, after: { quiet }, surface: 'item_view' });
    await load();
  }
  async function restItem(item) {
    const before = { status: item.status, parked_reason: item.parked_reason, today: item.today, fixed_time: item.fixed_time };
    const after = { status: 'parked', parked_reason: 'rest', today: false, fixed_time: null };
    await supabase.from('items').update(after).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'rest', before, after, surface: 'item_view' });
    setOpenItemId(null);
    await load();
  }
  async function reviveItem(item) {
    const { data: corr } = await supabase.from('corrections').select('before')
      .eq('item_id', item.id).eq('kind', 'rest').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const restore = { status: 'open', parked_reason: null, today: corr?.before?.today ?? false, fixed_time: corr?.before?.fixed_time ?? null };
    await supabase.from('items').update(restore).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'edit_field', before: { status: item.status }, after: restore, surface: 'item_view' });
    await load();
  }
  async function removeItem(item) {
    const before = { status: item.status };
    await supabase.from('items').update({ status: 'archived' }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'delete', before, after: { status: 'archived' }, surface: 'capture' });
    clearTimeout(ceaTimer.current);
    setCeaLine({
      text: `Removed ${item.title}.`,
      onUndo: async () => {
        await supabase.from('items').update(before).eq('id', item.id);
        setCeaLine(null);
        await load();
      },
    });
    ceaTimer.current = setTimeout(() => setCeaLine(null), 9000);
    if (openItemId === item.id) setOpenItemId(null);
    await load();
  }
  async function undoWholeDump(dump, items) {
    const live = items.filter(i => i.status !== 'archived');
    if (!live.length) return;
    const before = live.map(i => ({ id: i.id, status: i.status }));
    await supabase.from('items').update({ status: 'archived' }).in('id', live.map(i => i.id));
    await Promise.all(live.map(i => supabase.from('corrections').insert({
      user_id: userId, item_id: i.id, kind: 'delete', before: { status: i.status }, after: { status: 'archived' }, surface: 'capture',
    })));
    clearTimeout(ceaTimer.current);
    setCeaLine({
      text: `Undid this capture — ${live.length} item${live.length > 1 ? 's' : ''} removed.`,
      onUndo: async () => {
        await Promise.all(before.map(b => supabase.from('items').update({ status: b.status }).eq('id', b.id)));
        setCeaLine(null);
        await load();
      },
    });
    ceaTimer.current = setTimeout(() => setCeaLine(null), 9000);
    await load();
  }

  function prefillSay(text) {
    setSayText(text);
    requestAnimationFrame(() => sayInputRef.current?.focus());
  }

  async function submitSay(it) {
    const text = sayText.trim();
    if (!text || saySending) return;
    setSaySending(true);
    try {
      const result = await applyCorrection({ item: it, utterance: text, profile, userId, accessToken, surface: 'item_view' });
      if (result.kind === 'clarify') { setSayClarify(result.clarify); setSayText(''); }
      else {
        await markItemQuestionsAnswered(it.id, result.confirmation);
        showConfirmation(result);
        setSayText(''); setSayClarify(null);
        await load();
      }
    } catch { setErr('That didn’t land — try again.'); }
    setSaySending(false);
  }

  function renderItemRow(it, idx = 0, isFresh = false, showBorder = true) {
    const facts = factsFor(it);
    const held = heldStatusLine(it);
    const done = it.status === 'done';
    const checkable = isCheckable(it);
    return (
      <div key={it.id} className={`group${isFresh ? ' sprekta-fadeup' : ''}`}
        style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 0', borderBottom: showBorder ? `1px solid ${LINE}` : 'none', animationDelay: isFresh ? `${idx * 160}ms` : undefined }}>
        <button onClick={() => setOpenItemId(it.id)} style={{ flex: 1, minWidth: 0, display: 'flex', gap: 11, alignItems: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          {checkable ? (
            <button
              title={done ? 'Reopen' : 'Mark done'}
              onClick={(e) => { e.stopPropagation(); toggleDone(it); }}
              className="sprekta-marker-btn"
              style={{ marginTop: 1, width: 24, height: 24, marginLeft: -6, background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, flexShrink: 0 }}
            >
              <Marker item={it} />
            </button>
          ) : (
            <span style={{ marginTop: 3 }}><Marker item={it} /></span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500, color: done ? FAINT : INK, textDecoration: done ? 'line-through' : 'none', textDecorationColor: HAIR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
            <div style={{ opacity: done ? 0.45 : 1 }}>
              {held ? <div style={{ fontSize: 12.5, fontWeight: 500, color: '#736D60', marginTop: 2 }}>{held}</div> : <FactsLine facts={facts} />}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100" style={{ flexShrink: 0, alignSelf: 'flex-start', transition: 'opacity .15s' }}>
          <button title={it.flagged ? 'Unflag' : 'Mark priority'} onClick={() => toggleFlag(it)} className="hover:bg-[#F0ECE3]" style={ricon}><Flag size={14} style={{ color: it.flagged ? FLAG : STONE }} /></button>
          <button title="Discuss / change this" onClick={() => { setFocusItem({ id: it.id, title: it.title }); setComposerText(''); }} className="hover:bg-[#F0ECE3]" style={ricon}><MessageCircle size={14} style={{ color: STONE }} /></button>
          <button title="Remove" onClick={() => removeItem(it)} className="hover:bg-[#F0ECE3]" style={ricon}><Trash2 size={14} style={{ color: STONE }} /></button>
        </div>
      </div>
    );
  }

  function renderFooter(dump, items) {
    const rawOpen = rawOpenIds.has(dump.id);
    return (
      <div>
        {rawOpen && (
          <div className="sprekta-fadeup" style={{ borderTop: `1px solid ${LINE}`, marginTop: 2, paddingTop: 9, paddingBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: FAINT, marginBottom: 4 }}>You said</div>
            <div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.65, whiteSpace: 'pre-line' }}>“{dump.raw_text}”</div>
          </div>
        )}
        <div className="flex items-center" style={{ gap: 14, borderTop: `1px solid ${LINE}`, marginTop: 2, paddingTop: 9, paddingBottom: 8 }}>
          <button onClick={() => toggleRaw(dump.id)} className="flex items-center gap-1.5 hover:text-[#1D1B17]" style={{ border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: STONE, cursor: 'pointer', padding: 0 }}>
            You said <span style={{ fontSize: 10, display: 'inline-block', transition: 'transform .2s ease', transform: rawOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          <span style={{ flex: 1 }} />
          <button title="Undo this capture" onClick={() => undoWholeDump(dump, items)} className="hover:text-[#1D1B17]" style={{ border: 'none', background: 'none', cursor: 'pointer', color: FAINT, padding: 2, display: 'grid', placeItems: 'center' }}>
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    );
  }

  function renderPendingEntry() {
    if (!pendingEntry) return null;
    const firstLine = pendingEntry.text.split('\n')[0];
    const shortFirst = firstLine.length > 38 ? firstLine.slice(0, 37) + '…' : firstLine;
    if (pendingEntry.failed) {
      return (
        <div className="sprekta-slidein" style={{ padding: '13px 2px', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontSize: 14.5, color: INK }}>That didn’t land — try again. Your words are safe below.</div>
          <div style={{ fontSize: 13, color: STONE, marginTop: 6, fontStyle: 'italic', whiteSpace: 'pre-line' }}>“{pendingEntry.text}”</div>
          <button onClick={retryPending} style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: ACC, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Retry</button>
        </div>
      );
    }
    return (
      <div className="sprekta-slidein" style={{ padding: '13px 2px', borderBottom: `1px solid ${LINE}` }}>
        <div className="flex items-start gap-3">
          <div style={{ width: 26, height: 26, borderRadius: 8, background: ACC_SOFT, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Inbox size={14} style={{ color: ACC }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5 }}><b>{shortFirst}</b> <span style={{ color: STONE }}>— got it</span></div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: FAINT, marginTop: 1 }}>
              just now ·
              <span className="flex items-center gap-1.5">
                <span className="sprekta-pulsedot" style={{ width: 7, height: 7, borderRadius: 999, background: ACC, display: 'inline-block' }} />
                sorting it out
              </span>
            </div>
          </div>
        </div>
        <div className="ml-[14px] sm:ml-10 mr-1.5" style={{ marginTop: 10, background: CARD, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '4px 15px' }}>
          {[42, 61, 35].map((w, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: '12px 0', borderBottom: i < 2 ? `1px solid ${LINE}` : 'none' }}>
              <span className="sprekta-skel" style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0 }} />
              <span className="sprekta-skel" style={{ height: 12, width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Singles use the same "entry anatomy" as a multi-item summary row (chip
  // in a soft square, bold title, meta line) rather than the plainer
  // per-item dropdown-row anatomy — so a one-line capture doesn't read as
  // a different kind of list. The chip doubles as the checkbox for
  // todo/calendar items; parked rings are inert. No tray, no summary, no
  // "You said" footer — pinpoint and utterance provenance are the same
  // words for a single-item capture, so they live only in the item view.
  function renderSingleItemEntry(dump, it, isFresh) {
    const done = it.status === 'done';
    const checkable = isCheckable(it);
    const held = heldStatusLine(it);
    const facts = factsFor(it);
    const time = relTime(dump.created_at);

    // The 26px chip always keeps its soft background — done fills only the
    // inner glyph square, never the chip itself.
    const glyph = done
      ? <span style={{ width: 15, height: 15, borderRadius: 5, background: ACC, display: 'grid', placeItems: 'center' }}><Check size={11} style={{ color: '#fff' }} strokeWidth={3} /></span>
      : it.status === 'parked'
        ? <span style={{ width: 11, height: 11, borderRadius: 999, border: `1.5px solid ${RING}` }} />
        : it.fixed_time
          ? <CalIcon size={14} className="sprekta-marker-glyph" style={{ color: ACC }} />
          : <Square size={14} className="sprekta-marker-glyph" style={{ color: ACC }} />;

    const chip = checkable ? (
      <button
        title={done ? 'Reopen' : 'Mark done'}
        onClick={(e) => { e.stopPropagation(); toggleDone(it); }}
        className="sprekta-marker-btn"
        style={{ width: 26, height: 26, borderRadius: 8, background: ACC_SOFT, display: 'grid', placeItems: 'center', flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {glyph}
      </button>
    ) : (
      <div style={{ width: 26, height: 26, borderRadius: 8, background: ACC_SOFT, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {glyph}
      </div>
    );

    return (
      <div key={dump.id} className={isFresh ? 'sprekta-slidein' : ''} style={{ borderBottom: `1px solid ${LINE}` }}>
        <div className="group" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 6px 13px 2px' }}>
          <button onClick={() => setOpenItemId(it.id)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            <span style={{ marginTop: 1 }}>{chip}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: done ? FAINT : INK, textDecoration: done ? 'line-through' : 'none', textDecorationColor: HAIR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
              <div style={{ opacity: done ? 0.45 : 1 }}>
                {held ? (
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: FAINT }}>{time}</span><span style={{ margin: '0 8px', color: FAINT }}>·</span><span style={{ color: '#736D60', fontWeight: 500 }}>{held}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 3 }}>
                    <span style={{ color: FAINT }}>{time}</span>
                    {facts.map((f, i) => (
                      <span key={i} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', color: f.flag ? FLAG : ACC_DEEP, fontWeight: 500 }}>
                        <span style={{ margin: '0 8px', color: FAINT, fontWeight: 400 }}>·</span>
                        <span style={{ marginRight: 4, display: 'inline-flex' }}>{f.icon}</span>{f.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100" style={{ flexShrink: 0, marginTop: 2, transition: 'opacity .15s' }}>
            <button title={it.flagged ? 'Unflag' : 'Mark priority'} onClick={() => toggleFlag(it)} className="hover:bg-[#F0ECE3]" style={ricon}><Flag size={14} style={{ color: it.flagged ? FLAG : STONE }} /></button>
            <button title="Discuss / change this" onClick={() => { setFocusItem({ id: it.id, title: it.title }); setComposerText(''); }} className="hover:bg-[#F0ECE3]" style={ricon}><MessageCircle size={14} style={{ color: STONE }} /></button>
            <button title="Remove" onClick={() => removeItem(it)} className="hover:bg-[#F0ECE3]" style={ricon}><Trash2 size={14} style={{ color: STONE }} /></button>
          </div>
        </div>
      </div>
    );
  }

  function renderEntry({ dump, items }) {
    const isFresh = dump.id === freshEntryId;
    if (originalItemCount(dump, items) === 1) {
      return renderSingleItemEntry(dump, items[0], isFresh);
    }
    const isOpen = expandedIds.has(dump.id);
    const { first, more, parts } = entrySummary(items);
    return (
      <div key={dump.id} className={isFresh ? 'sprekta-slidein' : ''} style={{ borderBottom: `1px solid ${LINE}` }}>
        <button onClick={() => toggleEntry(dump.id)} className="hover:bg-black/[0.025]" style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '13px 6px 13px 2px', borderRadius: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: ACC_SOFT, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Inbox size={14} style={{ color: ACC }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5 }}>
              <b>{first.title}</b>{' '}
              <span style={{ color: STONE }}>{more > 0 ? `and ${more} more — organized` : '— organized'}</span>
            </div>
            <MetaLine parts={parts} />
          </div>
          {isOpen ? <ChevronUp size={13} style={{ color: FAINT, marginTop: 6, flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: FAINT, marginTop: 6, flexShrink: 0 }} />}
        </button>
        {isOpen && (
          <div className="sprekta-fadeup ml-[14px] sm:ml-10 mr-1.5 mb-3.5">
            <div style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '4px 15px' }}>
              {items.map((it, i) => renderItemRow(it, i, isFresh, i < items.length - 1))}
              {renderFooter(dump, items)}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderItemView() {
    const it = findItem(openItemId);
    if (!it) return null;
    const entry = entries.find(e => e.items.some(i => i.id === it.id));
    const isClarify = it.status === 'parked' && it.parked_reason === 'clarify';
    const isRest = it.status === 'parked' && it.parked_reason === 'rest';
    const facts = factsFor(it);
    const firstLine = entry ? entry.dump.raw_text.split('\n')[0] : '';
    return (
      <div style={{ position: 'fixed', inset: 0, background: PAPER, zIndex: 50, overflowY: 'auto' }}>
        <div className="max-w-[600px] mx-auto" style={{ padding: 'max(24px, env(safe-area-inset-top)) 20px 46px' }}>
          <button onClick={() => setOpenItemId(null)} className="flex items-center gap-1.5 hover:text-[#1D1B17]" style={{ border: 'none', background: 'none', fontSize: 14, color: STONE, cursor: 'pointer', padding: '4px 6px 4px 0', marginBottom: 14 }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-start gap-3">
            <span style={{ marginTop: 9 }}><Marker item={it} size={14} /></span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 25, letterSpacing: '-0.015em', lineHeight: 1.2, color: INK }}>{it.title}</div>
              {isClarify && <div style={{ fontSize: 13.5, color: STONE, margin: '2px 0 18px' }}>needs clarification · this evening</div>}
              {isRest && <div style={{ fontSize: 13.5, color: STONE, margin: '2px 0 18px' }}>resting · back in a day or two</div>}
              {!isClarify && !isRest && <div style={{ margin: '2px 0 18px' }}><FactsLine facts={facts} /></div>}
            </div>
          </div>

          {!isClarify && (
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 18 }}>
              {isCheckable(it) && (
                <button onClick={() => toggleDone(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>{it.status === 'done' ? 'reopen' : '✓ done'}</button>
              )}
              {!it.fixed_time && it.status === 'open' && (
                <button onClick={() => toggleToday(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>{it.today ? 'in today' : 'today'}</button>
              )}
              {(it.fixed_time || it.deadline) && it.status === 'open' && (
                <button onClick={() => toggleQuiet(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>{it.quiet ? 'un-quiet' : 'quiet this one'}</button>
              )}
              <button onClick={() => toggleFlag(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>{it.flagged ? 'unflag' : '⚑ priority'}</button>
              {it.status === 'open' && <button onClick={() => restItem(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>not now — rest it</button>}
              {isRest && <button onClick={() => reviveItem(it)} className="hover:bg-[#EAF3EE] hover:border-[#D3E6DC]" style={chip}>bring it back</button>}
            </div>
          )}

          {!isClarify && (
            <div style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 13, padding: '4px 15px', marginBottom: 14 }}>
              <div className="flex items-center gap-2.5" style={{ padding: '9px 0', borderBottom: `1px solid ${LINE}`, fontSize: 13.5 }}>
                <CalIcon size={13} style={{ color: STONE, flexShrink: 0 }} />
                <span style={{ color: STONE, width: 58, flexShrink: 0 }}>When</span>
                <span style={{ fontWeight: 500, flex: 1 }}>{it.fixed_time ? whenLabel(it) : it.deadline ? `due ${it.deadline}` : 'unscheduled'}</span>
                <button onClick={() => prefillSay('move it to ')} style={{ fontSize: 12, fontWeight: 600, color: ACC, background: 'none', border: 'none', cursor: 'pointer' }}>change</button>
              </div>
              <div className="flex items-center gap-2.5" style={{ padding: '9px 0', fontSize: 13.5 }}>
                <Bell size={13} style={{ color: STONE, flexShrink: 0 }} />
                <span style={{ color: STONE, width: 58, flexShrink: 0 }}>Remind</span>
                <span style={{ fontWeight: 500, flex: 1 }}>{it.quiet ? 'quiet' : (it.reminder_offsets || []).length ? it.reminder_offsets.map(OFFSET_LABEL).join(' · ') : '—'}</span>
                <button onClick={() => prefillSay('add another reminder ')} style={{ fontSize: 12, fontWeight: 600, color: ACC, background: 'none', border: 'none', cursor: 'pointer' }}>+ add</button>
              </div>
            </div>
          )}

          {ceaLine && (
            <div className="flex items-center justify-between sprekta-fadeup" style={{ fontSize: 13, color: '#4A4860', marginBottom: 14 }}>
              <span>{ceaLine.text}</span>
              {ceaLine.onUndo && <button onClick={ceaLine.onUndo} style={{ fontSize: 12.5, color: ACC, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>undo</button>}
            </div>
          )}

          {err && <div style={{ fontSize: 13, color: STONE, marginBottom: 12 }}>{err}</div>}

          <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
            <input
              ref={sayInputRef}
              value={sayText}
              onChange={e => setSayText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSay(it); }}
              placeholder={sayClarify || (isClarify ? 'tell me what this is — I’ll take it from there' : 'say anything — I’ll handle it')}
              className="sprekta-input"
              style={{ flex: 1, border: `1px solid ${HAIR}`, borderRadius: 999, background: '#fff', fontSize: 14, color: INK, padding: '10px 15px', outline: 'none' }}
            />
            <button onClick={() => submitSay(it)} disabled={saySending || !sayText.trim()} className="sprekta-send-btn" style={{ width: 36, height: 36, borderRadius: 999, border: 'none', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {saySending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
            </button>
          </div>

          <div style={{ fontSize: 12, color: FAINT, lineHeight: 1.7 }}>
            {entry && originalItemCount(entry.dump, entry.items) === 1 ? (
              // Single-item capture: pinpoint and utterance provenance are
              // the same words — one register, not from/part-of.
              <>You said <b style={{ color: STONE, fontWeight: 500 }}>“{entry.dump.raw_text}”</b> · {relTime(entry.dump.created_at)}</>
            ) : (
              <>
                {it.source && <>from <b style={{ color: STONE, fontWeight: 500 }}>“{it.source}”</b><br /></>}
                {entry && <>part of “{firstLine}{entry.dump.raw_text.includes('\n') ? '…' : ''}” · {relTime(entry.dump.created_at)}</>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${focusItem ? ACC_LINE : HAIR}`, borderRadius: 14, padding: '14px 15px', marginBottom: 10, boxShadow: focusItem ? `0 0 0 3px ${ACC_SOFT}` : 'none', transition: 'border-color .2s, box-shadow .2s' }}>
        {focusItem && (
          <div className="flex items-center gap-1.5 sprekta-fadeup" style={{ fontSize: 12, fontWeight: 500, color: ACC_DEEP, marginBottom: 7 }}>
            <span style={{ fontWeight: 600, color: FAINT }}>re:</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{focusItem.title}</span>
            <button onClick={() => setFocusItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACC, padding: '0 4px', display: 'flex' }}><X size={13} /></button>
          </div>
        )}
        <textarea
          value={composerText}
          onChange={e => setComposerText(e.target.value)}
          onKeyDown={focusItem ? (e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }) : undefined}
          rows={3}
          placeholder={focusItem ? (focusItem.clarify || 'say anything about this — I’ll handle it') : "What's on your mind?"}
          className="sprekta-input"
          style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.55, height: '4.8em', maxHeight: '4.8em', overflowY: 'auto', background: 'transparent', color: INK, fontFamily: 'inherit' }}
        />
        <div className="flex items-center justify-end" style={{ marginTop: 8 }}>
          <button onClick={send} disabled={sending || !composerText.trim()} className="sprekta-send-btn" style={{ color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>

      {ceaLine && (
        <div className="flex items-center justify-between" style={{ fontSize: 13, color: '#4A4860', marginBottom: 16 }}>
          <span>{ceaLine.text}</span>
          {ceaLine.onUndo && <button onClick={ceaLine.onUndo} style={{ fontSize: 12.5, color: ACC, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>undo</button>}
        </div>
      )}

      {err && <div style={{ fontSize: 13, color: STONE, marginBottom: 14 }}>{err}</div>}

      <div className="flex items-center gap-3" style={{ margin: '22px 0 4px' }}>
        <button onClick={collapseAll} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: FAINT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Captured</button>
        <span style={{ flex: 1, height: 1, background: HAIR }} />
      </div>

      {renderPendingEntry()}

      {entries.length === 0 && !pendingEntry
        ? <div style={{ padding: '26px 2px', textAlign: 'center', color: FAINT, fontSize: 14 }}>Nothing yet — dump what's on your mind above.</div>
        : entries.map(renderEntry)}

      {openItemId && renderItemView()}
    </div>
  );
}
