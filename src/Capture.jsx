import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send, Loader2, Inbox, Calendar as CalIcon, Bell, Flag, MessageCircle, Trash2,
  ChevronDown, ChevronUp, Circle, Square, ArrowLeft, X,
} from 'lucide-react';
import { supabase } from './lib/supabaseClient.js';
import {
  offloadSystemPrompt, prepareParsedItems, callClaude, grabJSON,
  persistQuestions, applyCorrection, undoCorrection, whenLabel,
} from './lib/parse.js';

const INK = '#22223B', PAPER = '#FAF9F6', CARD = '#FFFFFF', LINE = '#E7E4DC';
const AI = '#6A5AE0', MUTED = '#77748A', FLAG = '#B07A1E';

const OFFSET_LABEL = (m) => (m % 10080 === 0 ? `${m / 10080}w` : m % 1440 === 0 ? `${m / 1440}d` : `${m}m`);

const chipStyle = { fontSize: 12.5, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', border: `1px solid ${LINE}`, background: CARD, color: INK };
const iconBtnSm = { background: 'none', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: MUTED };

function markerFor(item, openQs) {
  if (item.status === 'parked') return <Circle size={14} style={{ color: MUTED, flexShrink: 0 }} />;
  if (openQs.some(q => q.tier >= 2)) return <Circle size={14} style={{ color: MUTED, flexShrink: 0 }} />;
  if (item.fixed_time) return <CalIcon size={14} style={{ color: AI, flexShrink: 0 }} />;
  return <Square size={14} style={{ color: MUTED, flexShrink: 0 }} />;
}

function factsFor(item) {
  const facts = [];
  if (item.flagged) facts.push({ icon: <Flag size={11} style={{ color: FLAG }} />, text: 'priority' });
  if (item.fixed_time) {
    const d = new Date(item.fixed_time);
    const days = Math.round((d - new Date()) / 86400000);
    const when = days >= 0 && days < 7
      ? d.toLocaleDateString([], { weekday: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'due ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    facts.push({ icon: <CalIcon size={11} />, text: when });
    (item.reminder_offsets || []).forEach(m => facts.push({ icon: <Bell size={11} />, text: OFFSET_LABEL(m) }));
  } else if (item.deadline) {
    facts.push({ icon: <CalIcon size={11} />, text: 'due ' + item.deadline });
  }
  return facts;
}

function entrySummary(items) {
  const first = items[0];
  const more = items.length - 1;
  const scheduled = items.filter(i => i.fixed_time).length;
  const todos = items.filter(i => !i.fixed_time && i.status === 'open').length;
  const resting = items.filter(i => i.status === 'parked').length;
  const parts = [];
  if (scheduled) parts.push(`${scheduled} scheduled`);
  if (todos) parts.push(`${todos} todo${todos > 1 ? 's' : ''}`);
  if (resting) parts.push(`${resting} resting`);
  return { first, more, meta: parts.join(' · ') };
}

// The Capture tab — the app's one intake surface. Composer + a feed of past
// captures ("entries"), each grouped by the dump that produced it. See
// sprekta-capture-design-doc.md for the full interaction spec; this is a v1
// subset (no voice, no torn/flip UI, no animated dwell/fold — entries just
// default-collapsed except the newest, toggle by tap).
export default function Capture({ profile, projects, userId, accessToken, onAfterCapture }) {
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [focusItem, setFocusItem] = useState(null); // { id, title, clarify?, placeholder? }
  const [ceaLine, setCeaLine] = useState(null); // { text, onUndo? }
  const [entries, setEntries] = useState([]); // [{ dump, items }]
  const [questionsByItem, setQuestionsByItem] = useState(new Map());
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [openItemId, setOpenItemId] = useState(null);
  const [sayText, setSayText] = useState('');
  const [saySending, setSaySending] = useState(false);
  const [sayClarify, setSayClarify] = useState(null);
  const [err, setErr] = useState('');
  const ceaTimer = useRef(null);

  const load = useCallback(async () => {
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
    if (list[0]) setExpandedIds(prev => new Set(prev).add(list[0].dump.id));
    const byItem = new Map();
    (qs || []).forEach((q) => {
      if (!q.item_id || q.status !== 'open') return;
      if (!byItem.has(q.item_id)) byItem.set(q.item_id, []);
      byItem.get(q.item_id).push(q);
    });
    setQuestionsByItem(byItem);
    return qs || [];
  }, [userId]);

  const allQuestionsRef = useRef([]);
  useEffect(() => { load().then((qs) => { allQuestionsRef.current = qs; }); }, [load]);

  function toggleEntry(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

  async function maybeMarkQuestionAnswered(itemId, answerText) {
    const q = allQuestionsRef.current.find(x => x.item_id === itemId && x.status === 'open' && x.kind === 'fact' && x.tier === 1);
    if (!q) return;
    await supabase.from('questions').update({ status: 'answered', answer: answerText, answered_at: new Date().toISOString() }).eq('id', q.id);
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
    const { data: dumpRow } = await supabase.from('dumps').insert({ user_id: userId, raw_text: text }).select().single();
    const rows = prepared.map(({ id, ...rest }) => ({ ...rest, user_id: userId, dump_id: dumpRow?.id || null }));
    const { data: inserted } = rows.length ? await supabase.from('items').insert(rows).select() : { data: [] };
    if (Array.isArray(parsed.questions) && parsed.questions.length && inserted?.length) {
      await persistQuestions(parsed.questions, inserted, parsed.items, userId);
    }
    if (onAfterCapture && inserted?.length) onAfterCapture(inserted);
    await load();
  }

  async function send() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true); setErr('');
    try {
      if (focusItem) {
        const item = findItem(focusItem.id);
        if (!item) { setErr('Couldn’t find that item anymore.'); setFocusItem(null); }
        else {
          const result = await applyCorrection({ item, utterance: text, profile, userId, accessToken, surface: 'capture_composer' });
          if (result.kind === 'clarify') {
            setFocusItem({ ...focusItem, clarify: result.clarify, placeholder: result.placeholder });
            setComposerText('');
          } else {
            await maybeMarkQuestionAnswered(focusItem.id, result.confirmation);
            showConfirmation(result);
            setFocusItem(null);
            setComposerText('');
            await load();
          }
        }
      } else {
        await runCapture(text);
        setComposerText('');
      }
    } catch { setErr('Parse hiccup — try again.'); }
    setSending(false);
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
  async function restItem(item) {
    await supabase.from('items').update({ status: 'parked', today: false }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'rest', before: { status: item.status, today: item.today }, after: { status: 'parked', today: false }, surface: 'item_view' });
    setOpenItemId(null);
    await load();
  }
  async function reviveItem(item) {
    await supabase.from('items').update({ status: 'open' }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'edit_field', before: { status: 'parked' }, after: { status: 'open' }, surface: 'item_view' });
    await load();
  }
  async function removeItem(item) {
    await supabase.from('items').update({ status: 'archived' }).eq('id', item.id);
    await supabase.from('corrections').insert({ user_id: userId, item_id: item.id, kind: 'delete', before: { status: item.status }, after: { status: 'archived' }, surface: 'capture' });
    clearTimeout(ceaTimer.current);
    setCeaLine({
      text: `Removed — ${item.title}`,
      onUndo: async () => {
        await supabase.from('items').update({ status: 'open' }).eq('id', item.id);
        setCeaLine(null);
        await load();
      },
    });
    ceaTimer.current = setTimeout(() => setCeaLine(null), 9000);
    if (openItemId === item.id) setOpenItemId(null);
    await load();
  }

  useEffect(() => { setSayText(''); setSayClarify(null); }, [openItemId]);

  async function submitSay(it) {
    const text = sayText.trim();
    if (!text || saySending) return;
    setSaySending(true);
    try {
      const result = await applyCorrection({ item: it, utterance: text, profile, userId, accessToken, surface: 'item_view' });
      if (result.kind === 'clarify') { setSayClarify(result.clarify); setSayText(''); }
      else {
        await maybeMarkQuestionAnswered(it.id, result.confirmation);
        showConfirmation(result);
        setSayText(''); setSayClarify(null);
        await load();
      }
    } catch { setErr('Hiccup — try again.'); }
    setSaySending(false);
  }

  function renderItemRow(it) {
    const openQs = questionsByItem.get(it.id) || [];
    const facts = factsFor(it);
    return (
      <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px' }}>
        <button onClick={() => setOpenItemId(it.id)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          {markerFor(it, openQs)}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
            {facts.length > 0 && (
              <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: MUTED, marginTop: 2, flexWrap: 'wrap' }}>
                {facts.map((f, i) => <span key={i} className="flex items-center gap-1">{f.icon}{f.text}</span>)}
              </div>
            )}
            {it.status === 'parked' && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>resting · back in a day or two</div>}
            {it.status === 'open' && openQs.some(q => q.tier >= 2) && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>needs clarification · answer below</div>}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button title="Flag" onClick={() => toggleFlag(it)} style={iconBtnSm}><Flag size={13} style={{ color: it.flagged ? FLAG : MUTED }} /></button>
          <button title="Discuss" onClick={() => { setFocusItem({ id: it.id, title: it.title }); setComposerText(''); }} style={iconBtnSm}><MessageCircle size={13} /></button>
          <button title="Remove" onClick={() => removeItem(it)} style={iconBtnSm}><Trash2 size={13} /></button>
        </div>
      </div>
    );
  }

  function renderEntry({ dump, items }) {
    const isOpen = expandedIds.has(dump.id);
    const { first, more, meta } = entrySummary(items);
    return (
      <div key={dump.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 12 }}>
        <button onClick={() => toggleEntry(dump.id)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <Inbox size={14} style={{ marginTop: 2, color: MUTED, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: INK }}><b>{first.title}</b>{more > 0 ? ` and ${more} more` : ''} — organized</div>
            {meta && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{meta}</div>}
          </div>
          {isOpen ? <ChevronUp size={15} style={{ color: MUTED, flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: MUTED, flexShrink: 0 }} />}
        </button>
        {isOpen && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map(renderItemRow)}
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6, paddingTop: 8, borderTop: `1px solid ${LINE}` }}>
              You said: <i>“{dump.raw_text}”</i>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderItemView() {
    const it = findItem(openItemId);
    if (!it) return null;
    const openQs = questionsByItem.get(it.id) || [];
    const entry = entries.find(e => e.items.some(i => i.id === it.id));
    return (
      <div style={{ position: 'fixed', inset: 0, background: PAPER, zIndex: 50, overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'max(22px, env(safe-area-inset-top)) 18px 40px' }}>
          <button onClick={() => setOpenItemId(null)} className="flex items-center gap-1.5" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, marginBottom: 16, padding: 0 }}><ArrowLeft size={15} /> Back</button>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: MUTED, marginBottom: 6 }}>ITEM</div>
          <div style={{ fontSize: 21, fontWeight: 600, color: INK, marginBottom: 8 }}>{it.title}</div>
          <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 18 }}>
            {it.status === 'parked' ? 'resting, not gone' : it.fixed_time ? whenLabel(it) : it.deadline ? `due ${it.deadline}` : 'anytime'}
          </div>

          {openQs.length > 0 && (
            <div style={{ background: '#FFF9EC', border: '1px solid #F0E2BE', borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8A6D1E', marginBottom: 4 }}>Needs an answer</div>
              {openQs.map(q => <div key={q.id} style={{ fontSize: 13.5, color: '#5B4B1E' }}>{q.text}</div>)}
            </div>
          )}

          <div className="flex items-center gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {!it.fixed_time && it.status === 'open' && <button onClick={() => toggleToday(it)} style={chipStyle}>{it.today ? 'in today' : 'today'}</button>}
            {it.status !== 'archived' && <button onClick={() => toggleFlag(it)} style={chipStyle}>{it.flagged ? 'unflag' : 'flag'}</button>}
            {it.status === 'open' && <button onClick={() => restItem(it)} style={chipStyle}>not now — rest it</button>}
            {it.status === 'parked' && <button onClick={() => reviveItem(it)} style={chipStyle}>bring it back</button>}
          </div>

          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <textarea
              value={sayText}
              onChange={e => setSayText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitSay(it); } }}
              rows={2}
              placeholder={sayClarify || (openQs.length ? 'answer here' : 'say the change — I’ll handle it')}
              style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', fontSize: 14.5, lineHeight: 1.5, background: 'transparent', color: INK, fontFamily: 'inherit' }}
            />
            <div className="flex items-center justify-end" style={{ marginTop: 6 }}>
              <button onClick={() => submitSay(it)} disabled={saySending || !sayText.trim()} style={{ background: (saySending || !sayText.trim()) ? '#9A96C9' : AI, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 11px', cursor: (saySending || !sayText.trim()) ? 'default' : 'pointer', display: 'flex' }}>
                {saySending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: MUTED }}>from <i>“{it.source || entry?.dump.raw_text || ''}”</i></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
        {focusItem && (
          <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: AI, marginBottom: 6 }}>
            re: {focusItem.title}
            <button onClick={() => setFocusItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0, display: 'flex' }}><X size={12} /></button>
          </div>
        )}
        <textarea
          value={composerText}
          onChange={e => setComposerText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={3}
          placeholder={focusItem ? (focusItem.clarify || 'say the change — I’ll handle it') : "What's on your mind?"}
          style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, height: '4.8em', maxHeight: '4.8em', overflowY: 'auto', background: 'transparent', color: INK, fontFamily: 'inherit' }}
        />
        <div className="flex items-center justify-end" style={{ marginTop: 8 }}>
          <button onClick={send} disabled={sending || !composerText.trim()} style={{ background: (sending || !composerText.trim()) ? '#9A96C9' : AI, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: (sending || !composerText.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {ceaLine && (
        <div className="flex items-center justify-between" style={{ fontSize: 13, color: '#4A4860', marginBottom: 16 }}>
          <span>{ceaLine.text}</span>
          {ceaLine.onUndo && <button onClick={ceaLine.onUndo} style={{ fontSize: 12.5, color: AI, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>undo</button>}
        </div>
      )}

      {err && <div style={{ fontSize: 13, color: '#B23', marginBottom: 14 }}>{err}</div>}

      <button onClick={collapseAll} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', marginBottom: 10 }}>CAPTURED</button>

      {entries.length === 0
        ? <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '26px 20px', textAlign: 'center', color: MUTED, fontSize: 14 }}>Nothing yet — dump what's on your mind above.</div>
        : <div className="flex flex-col gap-2">{entries.map(renderEntry)}</div>}

      {openItemId && renderItemView()}
    </div>
  );
}
