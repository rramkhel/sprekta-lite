import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Share, MoreVertical, Mic, MicOff, Lock, Flag } from 'lucide-react';

const PAPER = '#FAF9F6', INK = '#22223B', LINE = '#E7E4DC', MUTED = '#77748A';
const IRIS = '#6A5AE0', FERN = '#12886A';
const SERIF = 'Iowan Old Style, Palatino Linotype, Georgia, serif';
const SANS = 'ui-sans-serif, system-ui, sans-serif';

const JOBTYPES = ['Student', 'Retired', 'At home', 'Shift work', 'Creative', 'Contractor', 'Self-employed', 'Between things', 'It varies'];
const PROTECT = ['Gym / training', 'Reading', 'A side project', 'Time with people', 'Family time', 'Creative work', 'Rest', 'Learning', 'Outdoors', 'A hobby', 'Faith / practice', 'Cooking'];
const PEOPLE = ['Partner', 'Kids', 'Parents', 'Siblings', 'Close friends', 'Roommate', 'A pet', 'Just me'];
const RIDES = ['Car', 'Transit', 'Walk / bike', 'Rideshare', 'Carpool', 'Depends', 'Other'];

export const WISHES = [
  { key: 'clear', label: 'Clear my head', sub: 'dump everything, it gets sorted', color: '#6A5AE0' },
  { key: 'big', label: 'Plan something big', sub: 'a wedding, a move, a launch', color: '#C25A76' },
  { key: 'remember', label: 'Remember things for me', sub: 'the small stuff, handled', color: '#C77D2E' },
  { key: 'room', label: 'Make room for what matters', sub: 'the thing that keeps losing', color: '#2E9E8F' },
  { key: 'protectwork', label: 'Protect focus time', sub: 'block real hours for deep work', color: '#4E7CA1' },
  { key: 'reverse', label: 'Work back from deadlines', sub: 'start at the date, plan backward', color: '#8A6D1E' },
];

const DEMO_DUMP = 'renew my driver’s licence, dentist thu 2pm, pick up the prescription, gym twice, passport before the trip';
const DEMO_TODAY = [
  { t: 'Prescription pickup', w: '5:40 · on the way home', c: '#C77D2E' },
];
const DEMO_WEEK = [
  { t: 'Gym', w: 'Tue + Thu · 9pm', c: '#6A5AE0' },
  { t: 'Passport renewal', w: 'Wed lunch · before the trip', c: '#8A6D1E' },
  { t: 'Dentist', w: 'Thu · 2:00', c: '#4E7CA1' },
  { t: 'Licence renewal', w: 'Sat morning · before it expires', c: '#C25A76' },
];
const DEMO_COUNT = DEMO_TODAY.length + DEMO_WEEK.length;

const BIG_TITLE = 'Moving day — Aug 1';
const BIG_STEPS = [
  { t: 'Book movers', w: '3 weeks out', c: '#6A5AE0' },
  { t: 'Utilities + address change', w: '2 weeks out', c: '#4E7CA1' },
  { t: 'Pack, room by room', w: 'the weekend before', c: '#C77D2E' },
  { t: 'Keys, clean, done', w: 'day before', c: '#12886A' },
];

const REMEMBER_TODAY = [
  { ts: '5:40 pm', x: 'Pharmacy closes at 8 — grab the refill on the way home.' },
  { ts: '8:00 pm', x: 'Bins out tonight — collection’s early tomorrow.' },
];
const REMEMBER_LATER = [
  { ts: 'Wed', x: 'Mom’s birthday Friday — order the flowers by Wednesday to make it.' },
  { ts: 'Thu', x: 'Library books are due — drop them on your way past.' },
];

const ROOM_LOCKED = [
  { col: 1, top: 44, t: 'Gym' },
  { col: 3, top: 82, t: 'Dinner' },
  { col: 4, top: 24, t: 'Licence' },
];
const ROOM_NOISE = [
  { t: 'emails', p: [{ col: 0, top: 20 }, { col: 0, top: 20 }, { col: 0, top: 20 }] },
  { t: 'errand', p: [{ col: 1, top: 14 }, { col: 0, top: 48 }, { col: 0, top: 48 }] },
  { t: 'calls', p: [{ col: 2, top: 38 }, { col: 2, top: 20 }, { col: 2, top: 20 }] },
  { t: 'fix the sink', p: [{ col: 3, top: 30 }, { col: 2, top: 48 }, { col: 2, top: 48 }] },
  { t: 'paperwork', p: [{ col: 4, top: 66 }, { col: 3, top: 20 }, { col: 3, top: 20 }] },
  { t: 'shopping', p: [{ col: 2, top: 88 }, { col: 4, top: 64 }, { col: 4, top: 64 }] },
];
const ROOM_WORK = { t: 'report', p: [{ col: 0, top: 78 }, { col: 1, top: 106 }, { col: 1, top: 106 }] };
const ROOM_CAPTIONS = [null,
  { bold: 'Your non-negotiables stop getting forgotten.', rest: ' Everything else gets rescheduled around them.' },
  { bold: 'Didn’t finish the report?', rest: ' Round 2 books itself — around the locked stuff.' },
];

const FLIGHT_NOTE = 'A vet recheck landed Thursday — so laundry slid to Tuesday and packing to Wednesday. Friday’s flight never moved.';

const LEARN_CHIPS = [
  { obs: 'You’re most consistent at the gym in the evening.', act: 'Now scheduling workouts after 6pm.' },
  { obs: 'Morning errands keep slipping to afternoon.', act: 'Stopped booking them before 11am.' },
  { obs: 'Focused work rarely survives a packed Friday.', act: 'Fridays kept lighter from now on.' },
];

const LEARN_TIP = 'You hit the gym 4 weeks running when it’s a 9pm slot — want me to make that your default?';
const ACC_NOTE = 'Did the gym happen tonight?';

const INTRO_HEADS = [
  null,
  'Something big? It breaks it into steps — and schedules them.',
  'It remembers the small stuff — and nudges at the right time.',
  'It keeps the big picture.',
  'A deadline lands — the prep schedules itself backward.',
  'It gets smarter about you every week.',
  'Want backup? It can hold you to it.',
];

const GRID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GRID_BANDS = ['Morning', 'Midday', 'Evening'];

const trunc = (s, n = 72) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

// ---- module-scope helper components (hoisted per port instructions: keeps
// remount-on-keystroke / focus-loss bugs from creeping back in) ----

function TextBox({ value, onChange, placeholder, rows = 3, onEnter }) {
  return (
    <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && onEnter) { e.preventDefault(); onEnter(); } }}
      placeholder={placeholder}
      style={{ fontFamily: SANS, width: '100%', resize: 'none', border: `1.5px solid ${LINE}`, borderRadius: 12, background: '#fff', outline: 'none', fontSize: 15, lineHeight: 1.6, padding: '12px 14px', color: INK }} />
  );
}

function Chip({ text, on, color = IRIS, onTap }) {
  return (
    <button onClick={onTap} style={{
      fontFamily: SANS, fontSize: 14.5, padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', outline: 'none',
      border: `1.5px solid ${on ? color : LINE}`, background: on ? color + '1A' : '#fff',
      color: on ? color : '#4A4860', fontWeight: on ? 600 : 450, transition: 'all 120ms ease',
    }}>{text}{on && <Check size={14} style={{ flexShrink: 0 }} />}</button>
  );
}

function MicBtn({ active, onTap }) {
  return (
    <button onClick={onTap} aria-label={active ? 'Stop recording' : 'Speak instead'}
      style={{ fontFamily: SANS, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: active ? '#fff' : IRIS, background: active ? '#D8552E' : '#F1F0FB', border: `1px solid ${active ? '#D8552E' : '#E3E1F7'}`, borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}>
      {active ? <><MicOff size={13} /> Listening — tap to stop</> : <><Mic size={13} /> Speak instead</>}
    </button>
  );
}

function Q({ anim, children }) {
  return <div style={{ fontFamily: SERIF, fontSize: 27, lineHeight: 1.25, color: INK, marginBottom: 10, letterSpacing: '-0.01em', opacity: anim ? 1 : 0, transform: anim ? 'none' : 'translateY(6px)', transition: 'all 260ms ease' }}>{children}</div>;
}
function Sub({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginBottom: 20, lineHeight: 1.55 }}>{children}</div>;
}
function Wrap({ anim, children }) {
  return <div style={{ opacity: anim ? 1 : 0, transition: 'opacity 260ms ease 60ms' }}>{children}</div>;
}
function NextBtn({ onNext, label = 'Continue' }) {
  return (
    <button onClick={onNext} style={{ fontFamily: SANS, marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 550, color: '#fff', background: INK, border: 'none', borderRadius: 12, padding: '12px 22px', cursor: 'pointer' }}>{label}<ArrowRight size={16} /></button>
  );
}
function SkipLink({ onSkip, label = 'Skip' }) {
  return (
    <button onClick={onSkip} style={{ fontFamily: SANS, display: 'block', marginTop: 14, fontSize: 13, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{label}</button>
  );
}
function H2({ children, top = 20 }) {
  return <div style={{ fontFamily: SERIF, fontSize: 19, color: '#4A4860', margin: `${top}px 0 8px` }}>{children}</div>;
}

// A textbox with an integrated, dictation-enabled mic. value/onChange are the field's;
// onChange must accept a string. Registers itself with the parent's voice registry
// on every render so toggleVoice always targets the current value/setter.
function VoiceBox({ target, value, onChange, placeholder, rows = 2, voiceTarget, onToggleVoice, registerVoice }) {
  registerVoice(target, value, onChange);
  return (
    <div style={{ position: 'relative' }}>
      <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ fontFamily: SANS, width: '100%', resize: 'none', border: `1.5px solid ${voiceTarget === target ? IRIS : LINE}`, borderRadius: 12, background: '#fff', outline: 'none', fontSize: 15, lineHeight: 1.6, padding: '12px 14px', paddingBottom: 40, color: INK, transition: 'border-color 150ms' }} />
      <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
        <MicBtn active={voiceTarget === target} onTap={() => onToggleVoice(target)} />
      </div>
    </div>
  );
}

export default function Onboarding({ onFinish }) {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState(null);
  const [jobVaries, setJobVaries] = useState('');
  const [weekday, setWeekday] = useState('');
  const [weekend, setWeekend] = useState('');
  const [anchors, setAnchors] = useState('');
  const [gridCells, setGridCells] = useState({});
  const [branch, setBranch] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [wishNote, setWishNote] = useState('');
  const [challenge, setChallenge] = useState('');
  const [protect, setProtect] = useState([]);
  const [protectNote, setProtectNote] = useState('');
  const [resp, setResp] = useState('');
  const [loves, setLoves] = useState('');
  const [nonos, setNonos] = useState('');
  const [lifeBig, setLifeBig] = useState('');
  const [people, setPeople] = useState([]);
  const [peopleNote, setPeopleNote] = useState('');
  const [rides, setRides] = useState([]);
  const [rideOther, setRideOther] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [ledger, setLedger] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [anim, setAnim] = useState(true);
  const [platform, setPlatform] = useState('iphone');
  const [voiceTarget, setVoiceTarget] = useState(null);
  const [voiceNote, setVoiceNote] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [demo, setDemo] = useState({ chars: 0, shown: 0 });
  const [introSlide, setIntroSlide] = useState(0);
  const [dphase, setDphase] = useState(0);
  const [dshown, setDshown] = useState(0);
  const recRef = useRef(null);
  const ledgerEnd = useRef(null);

  const steps = ['intro', 'name', 'work', 'days', 'standing', 'protect', 'wish', 'tomorrow', 'read'];
  const step = steps[Math.min(stepIdx, steps.length - 1)];

  useEffect(() => { setAnim(false); const t = setTimeout(() => setAnim(true), 30); return () => clearTimeout(t); }, [stepIdx]);
  useEffect(() => { ledgerEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [ledger]);

  // page-1 demos: each slide plays its animation once, then rests on the final frame
  useEffect(() => {
    if (step !== 'intro') return;
    let alive = true; const timers = [];
    const twoPhase = (holdA) => {
      setDphase(0);
      timers.push(setTimeout(() => { if (alive) setDphase(1); }, holdA));
    };
    const threePhase = (a, b) => {
      setDphase(0);
      timers.push(setTimeout(() => {
        if (!alive) return; setDphase(1);
        timers.push(setTimeout(() => { if (alive) setDphase(2); }, b));
      }, a));
    };
    const counter = (n, stepMs, startDelay = 400) => {
      setDshown(0);
      timers.push(setTimeout(() => {
        let j = 0;
        const t = setInterval(() => {
          if (!alive) return clearInterval(t);
          j += 1; setDshown(j);
          if (j >= n) clearInterval(t);
        }, stepMs);
        timers.push(t);
      }, startDelay));
    };
    if (introSlide === 0) {
      setDemo({ chars: 0, shown: 0 });
      let i = 0;
      const ti = setInterval(() => {
        if (!alive) return clearInterval(ti);
        i += 1; setDemo(d => ({ ...d, chars: i }));
        if (i >= DEMO_DUMP.length) {
          clearInterval(ti);
          timers.push(setTimeout(() => {
            let j = 0;
            const t2 = setInterval(() => {
              if (!alive) return clearInterval(t2);
              j += 1; setDemo(d => ({ ...d, shown: j }));
              if (j >= DEMO_COUNT) clearInterval(t2);
            }, 380);
            timers.push(t2);
          }, 500));
        }
      }, 24);
      timers.push(ti);
    }
    else if (introSlide === 1) twoPhase(1400);
    else if (introSlide === 2) counter(REMEMBER_TODAY.length + REMEMBER_LATER.length, 620);
    else if (introSlide === 3) threePhase(1600, 2400);
    else if (introSlide === 4) counter(6, 780);
    else if (introSlide === 5) counter(4, 680);
    else counter(3, 760);
    return () => { alive = false; timers.forEach(t => { clearInterval(t); clearTimeout(t); }); };
  }, [step, introSlide]);

  const learn = (key, text, color = FERN) => setLedger(l => {
    const rest = l.filter(e => e.key !== key);
    return text ? [...rest, { key, text, color }] : rest;
  });

  // Every ledger line is derived here, purely from current state — never
  // computed inline inside a tap handler. That means two chip taps fired in
  // the same React batch (e.g. two clicks with no re-render between them)
  // can never lose an update to a stale closure: each setState call below
  // uses the functional updater form, and the ledger effects always read
  // the latest committed state after render, not a snapshot from whenever
  // the handler was defined.
  useEffect(() => { learn('wd', weekday.trim() ? 'weekdays: ' + trunc(weekday.trim().toLowerCase()) : null, IRIS); }, [weekday]);
  useEffect(() => { learn('we', weekend.trim() ? 'weekends: ' + trunc(weekend.trim().toLowerCase()) : null, IRIS); }, [weekend]);
  useEffect(() => { learn('anchor', anchors.trim() ? 'anchors: ' + trunc(anchors.trim().toLowerCase()) : null, IRIS); }, [anchors]);
  useEffect(() => { learn('resp', resp.trim() ? 'keeping track of: ' + trunc(resp.trim().toLowerCase()) : null, FERN); }, [resp]);
  useEffect(() => { learn('loves', loves.trim() ? 'into: ' + trunc(loves.trim().toLowerCase()) : null, '#C25A76'); }, [loves]);
  useEffect(() => { learn('nono', nonos.trim() ? 'non-negotiables: ' + trunc(nonos.trim().toLowerCase()) : null, '#C25A76'); }, [nonos]);
  useEffect(() => { learn('season', lifeBig.trim() ? 'on the horizon / lately: ' + trunc(lifeBig.trim().toLowerCase()) : null, '#C25A76'); }, [lifeBig]);
  useEffect(() => { learn('tmrw', tomorrow.trim() ? 'this week: ' + trunc(tomorrow.trim().toLowerCase()) : null, '#C77D2E'); }, [tomorrow]);
  useEffect(() => { learn('challenge', challenge.trim() ? 'where planning breaks down: ' + trunc(challenge.trim().toLowerCase()) : null, '#C25A76'); }, [challenge]);

  useEffect(() => {
    const base = jobTitle.trim() || jobType;
    const t = jobType === 'It varies' && jobVaries.trim() ? 'it varies — ' + jobVaries.trim() : base;
    learn('work', t ? 'work: ' + String(t).toLowerCase() : null, IRIS);
  }, [jobTitle, jobType, jobVaries]);
  const onJobTitle = (v) => { setJobTitle(v); setJobType(null); };
  const tapJobType = (v) => { setJobType(t => t === v ? null : v); setJobTitle(''); };
  const onJobVaries = (v) => { setJobVaries(v); };

  useEffect(() => {
    const labels = wishes.map(k => WISHES.find(w => w.key === k)?.label.toLowerCase());
    const all = [...labels, ...(wishNote.trim() ? [wishNote.trim().toLowerCase()] : [])];
    learn('wish', all.length ? 'wants: ' + all.join(' · ') : null, '#C77D2E');
  }, [wishes, wishNote]);
  const tapWish = (k) => setWishes(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);

  useEffect(() => {
    const all = [...protect, ...(protectNote.trim() ? [protectNote.trim()] : [])];
    learn('protect', all.length ? 'holding time for: ' + all.join(', ').toLowerCase() : null, '#2E9E8F');
  }, [protect, protectNote]);
  const tapProtect = (v) => setProtect(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const onProtectNote = (v) => { setProtectNote(v); };

  useEffect(() => {
    const all = [...people.filter(p => p !== 'Just me'), ...(peopleNote.trim() ? [peopleNote.trim()] : [])];
    learn('people', people.includes('Just me') && !all.length ? 'day to day: just you' : all.length ? 'day to day: ' + all.join(', ').toLowerCase() : null, '#C25A76');
  }, [people, peopleNote]);
  const tapPeople = (v) => setPeople(prev => {
    if (v === 'Just me') return prev.includes('Just me') ? [] : ['Just me'];
    return prev.includes(v) ? prev.filter(x => x !== v) : [...prev.filter(x => x !== 'Just me'), v];
  });
  const onPeopleNote = (v) => { setPeopleNote(v); };

  useEffect(() => {
    const all = [...rides.filter(r => r !== 'Other'), ...(rides.includes('Other') && rideOther.trim() ? [rideOther.trim()] : [])];
    learn('ride', all.length ? 'gets around by: ' + all.join(', ').toLowerCase() : rides.includes('Other') ? 'gets around by: (tell me more)' : null, IRIS);
  }, [rides, rideOther]);
  const tapRide = (v) => setRides(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const onRideOther = (v) => { setRideOther(v); };

  const onTomorrow = (v) => { setTomorrow(v); };
  const onChallenge = (v) => { setChallenge(v); };

  useEffect(() => {
    const count = Object.keys(gridCells).length;
    learn('grid', count ? 'blocked on the calendar: ' + count + (count === 1 ? ' fixed slot' : ' fixed slots') : null, IRIS);
  }, [gridCells]);
  const toggleCell = (day, band) => {
    const key = day + '-' + band;
    setGridCells(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  };

  // registry: any voice-enabled field registers { value, onChange }
  const voiceReg = useRef({});
  const registerVoice = (target, value, onChange) => { voiceReg.current[target] = { value, onChange }; };
  function toggleVoice(target) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceNote('Voice isn’t available in this browser — typing works just as well.'); return; }
    if (voiceTarget) { try { recRef.current?.stop(); } catch {} setVoiceTarget(null); if (voiceTarget === target) return; }
    try {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
      rec.onresult = (e) => {
        let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        const reg = voiceReg.current[target];
        if (t.trim() && reg) reg.onChange((reg.value ? reg.value + ' ' : '') + t.trim());
      };
      rec.onend = () => setVoiceTarget(v => v === target ? null : v);
      rec.onerror = () => { setVoiceTarget(null); setVoiceNote('Couldn’t reach the mic — typing works just as well.'); };
      recRef.current = rec; rec.start(); setVoiceTarget(target); setVoiceNote('');
    } catch { setVoiceNote('Voice isn’t available here — typing works just as well.'); }
  }

  const next = useCallback(() => setStepIdx(i => i + 1), []);
  const back = useCallback(() => setStepIdx(i => Math.max(i - 1, 0)), []);
  const canBack = stepIdx > 0;

  const first = name.trim().split(' ')[0];

  async function handleSeeMyWeek() {
    if (finishing) return;
    setFinishing(true);
    try {
      await onFinish({
        name, jobTitle, jobType, jobVaries, weekday, weekend, anchors, gridCells,
        resp, protect, protectNote, challenge, wishes, wishNote,
        loves, nonos, lifeBig, people, peopleNote, rides, rideOther, tomorrow,
      });
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div style={{ background: PAPER, minHeight: '100vh', fontFamily: SANS, color: INK, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: 620, width: '100%', margin: '0 auto', padding: '30px 24px 12px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {(canBack || branch) && step !== 'read'
              ? <button onClick={() => branch ? setBranch(branch === 'people' ? 'life' : null) : back()} aria-label="Back" style={{ background: 'none', border: `1px solid ${LINE}`, borderRadius: 10, padding: 6, cursor: 'pointer', color: MUTED, display: 'flex' }}><ArrowLeft size={15} /></button>
              : <span style={{ width: 29 }} />}
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Sprekta<span style={{ color: FERN }}>.</span></span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {stepIdx > 0 && steps.slice(1).map((s, i) => <span key={s} style={{ width: i === stepIdx - 1 ? 16 : 5, height: 5, borderRadius: 999, background: i <= stepIdx - 1 ? IRIS : '#E2DFEE', transition: 'all 200ms ease' }} />)}
          </div>
        </div>

        {step === 'intro' && (() => {
          const LAST = 6;
          const advance = () => introSlide < LAST ? setIntroSlide(s => s + 1) : next();
          const COLS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const noteCard = (txt, on) => (
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 13px', boxShadow: '0 1px 3px rgba(34,34,59,0.05)', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: 'all 400ms ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: IRIS, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 650, color: IRIS }}>Sprekta</span>
                <span style={{ fontSize: 10.5, color: '#B8B5C6', marginLeft: 'auto' }}>now</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#3B3856', lineHeight: 1.45 }}>{txt}</div>
            </div>
          );
          return (
            <Wrap anim={anim}>
              {introSlide === 0
                ? <Q anim={anim}>Drop in the things you’d usually forget. Sprekta turns them into your calendar and to-do list — planned around <i>your</i> day.</Q>
                : <Q anim={anim}>{INTRO_HEADS[introSlide]}</Q>}

              <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, boxShadow: '0 1px 4px rgba(34,34,59,0.06)', marginBottom: 14, minHeight: 286 }}>
                {introSlide === 0 && (
                  <>
                    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', minHeight: 58, fontSize: 13.5, lineHeight: 1.55, color: '#4A4860' }}>
                      {DEMO_DUMP.slice(0, demo.chars)}
                      {demo.chars < DEMO_DUMP.length && <span style={{ display: 'inline-block', width: 2, height: 14, background: IRIS, marginLeft: 1, verticalAlign: '-2px' }} />}
                    </div>
                    <div style={{ height: 12 }} />
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', color: '#B8B5C6', marginBottom: 6, opacity: demo.shown > 0 ? 1 : 0, transition: 'opacity 300ms ease' }}>TODAY</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {DEMO_TODAY.map((it, i) => {
                        const on = demo.shown > i;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 11px', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: 'all 300ms ease' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span style={{ width: 7, height: 7, borderRadius: 999, background: it.c, flexShrink: 0 }} />
                              <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</span>
                            </span>
                            <span style={{ fontSize: 12, color: FERN, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.w}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', color: '#B8B5C6', marginBottom: 6, opacity: demo.shown > DEMO_TODAY.length ? 1 : 0, transition: 'opacity 300ms ease' }}>THIS WEEK</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {DEMO_WEEK.map((it, i) => {
                        const on = demo.shown > DEMO_TODAY.length + i;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 11px', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', transition: 'all 300ms ease' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span style={{ width: 7, height: 7, borderRadius: 999, background: it.c, flexShrink: 0 }} />
                              <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</span>
                            </span>
                            <span style={{ fontSize: 12, color: FERN, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.w}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {introSlide === 1 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, marginTop: dphase === 1 ? 0 : 66, transition: 'margin 600ms cubic-bezier(.4,.1,.2,1)' }}>
                      <div style={{ fontFamily: SERIF, fontSize: dphase === 1 ? 15 : 19, background: '#C25A7614', border: '1.5px solid #C25A7666', color: '#C25A76', borderRadius: 999, padding: dphase === 1 ? '7px 16px' : '12px 22px', transition: 'all 600ms cubic-bezier(.4,.1,.2,1)', whiteSpace: 'nowrap' }}>{BIG_TITLE}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {BIG_STEPS.map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 11px', opacity: dphase === 1 ? 1 : 0, transform: dphase === 1 ? 'none' : 'translateY(-10px) scale(0.96)', transition: `all 450ms ease ${i * 140}ms` }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 999, background: b.c, flexShrink: 0 }} />
                            <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.t}</span>
                          </span>
                          <span style={{ fontSize: 12, color: FERN, whiteSpace: 'nowrap', flexShrink: 0 }}>{b.w}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 10, opacity: dphase === 1 ? 1 : 0, transition: 'opacity 500ms ease 600ms' }}>
                      One line in — a scheduled path out. Every piece lands on a real day.
                    </div>
                  </>
                )}

                {introSlide === 2 && (() => {
                  const noteRow = (n, on) => (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: 'all 350ms ease' }}>
                      <span style={{ fontSize: 11, fontWeight: 650, color: MUTED, width: 58, flexShrink: 0, paddingTop: 12, textAlign: 'right' }}>{n.ts}</span>
                      <div style={{ flex: 1, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 13px', boxShadow: '0 1px 3px rgba(34,34,59,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: IRIS, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 650, color: IRIS }}>Sprekta</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#3B3856', lineHeight: 1.45 }}>{n.x}</div>
                      </div>
                    </div>
                  );
                  return (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#B8B5C6', marginBottom: 8 }}>TODAY</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                        {REMEMBER_TODAY.map((n, i) => noteRow(n, dshown > i))}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#B8B5C6', marginBottom: 8 }}>LATER THIS WEEK</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {REMEMBER_LATER.map((n, i) => noteRow(n, dshown > REMEMBER_TODAY.length + i))}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 12, opacity: dshown >= REMEMBER_TODAY.length + REMEMBER_LATER.length ? 1 : 0, transition: 'opacity 500ms ease 300ms' }}>
                        You never carry these in your head again — each nudge arrives right when it’s useful.
                      </div>
                    </>
                  );
                })()}

                {introSlide === 3 && (
                  <>
                    <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                      {COLS.map(d => <div key={d} style={{ flex: 1, fontSize: 10, color: MUTED, textAlign: 'center' }}>{d}</div>)}
                    </div>
                    <div style={{ position: 'relative', height: 172, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
                      {[1, 2, 3, 4].map(i => <div key={i} style={{ position: 'absolute', left: `${i * 20}%`, top: 0, bottom: 0, borderLeft: `1px dashed #EFEDE6` }} />)}
                      {ROOM_NOISE.map((n, i) => {
                        const pos = n.p[dphase];
                        return (
                          <div key={i} style={{ position: 'absolute', left: `calc(${pos.col * 20}% + 4px)`, width: 'calc(20% - 8px)', top: pos.top, height: 14, background: '#DEDBE6', borderRadius: 999, transition: 'all 700ms cubic-bezier(.4,.1,.2,1)' }} />
                        );
                      })}
                      <div style={{ position: 'absolute', left: `calc(${ROOM_WORK.p[dphase].col * 20}% + 4px)`, width: 'calc(20% - 8px)', top: ROOM_WORK.p[dphase].top, height: 18, background: '#C77D2E33', borderRadius: 999, transition: 'all 700ms cubic-bezier(.4,.1,.2,1)', boxShadow: dphase === 2 ? '0 0 0 1.5px #ECB29B' : 'none', zIndex: 2 }} />
                      <div style={{ position: 'absolute', left: `calc(40% + 4px)`, width: 'calc(20% - 8px)', top: 128, height: 18, background: '#C77D2E33', borderRadius: 999, opacity: dphase === 2 ? 1 : 0, transform: dphase === 2 ? 'none' : 'translateY(8px)', transition: 'all 500ms ease 400ms', zIndex: 2 }} />
                      {ROOM_LOCKED.map((b, i) => (
                        <div key={i} style={{ position: 'absolute', left: `calc(${b.col * 20}% + 3px)`, width: 'calc(20% - 6px)', top: b.top, height: 34, background: FERN + '1E', border: `1px solid ${FERN}55`, borderLeft: `3px solid ${FERN}`, borderRadius: 7, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, padding: '0 5px', zIndex: 3 }}>
                          <Lock size={9} style={{ color: FERN, flexShrink: 0 }} />
                          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#0E6B54', lineHeight: 1.1, overflow: 'hidden' }}>{b.t}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 10, color: MUTED }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 8, borderRadius: 999, background: FERN + '1E', border: `1px solid ${FERN}55`, borderLeft: `2px solid ${FERN}` }} /> locked</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 8, borderRadius: 999, background: '#DEDBE6' }} /> everything else</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 8, minHeight: 36 }}>
                      {ROOM_CAPTIONS[dphase] && (
                        <span style={{ opacity: 1, transition: 'opacity 400ms ease' }}>
                          <b style={{ color: dphase === 2 ? '#C77D2E' : FERN }}>{ROOM_CAPTIONS[dphase].bold}</b>{ROOM_CAPTIONS[dphase].rest}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {introSlide === 4 && (
                  <>
                    <div style={{ display: 'flex', gap: 8, height: 168, marginBottom: 10 }}>
                      {['Tue', 'Wed', 'Thu', 'Fri'].map((d, col) => {
                        const isFri = col === 3;
                        const laundryThu = col === 2 && dshown >= 2 && dshown < 4;
                        const packThu = col === 2 && dshown >= 2 && dshown < 5;
                        const dinnerThu = col === 2 && dshown >= 3;
                        const laundryTue = col === 0 && dshown >= 4;
                        const packWed = col === 1 && dshown >= 5;
                        return (
                          <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginBottom: 5 }}>{d}</div>
                            <div style={{ flex: 1, background: PAPER, border: `1px solid ${isFri ? '#EBC6B8' : LINE}`, borderRadius: 10, position: 'relative', overflow: 'hidden' }}>
                              {isFri && (
                                <div style={{ position: 'absolute', top: 8, left: 6, right: 6, display: 'flex', alignItems: 'center', gap: 5, background: '#FCEEE8', border: '1px solid #F1D3C6', borderRadius: 8, padding: '6px 7px', opacity: dshown >= 1 ? 1 : 0, transform: dshown >= 1 ? 'none' : 'translateY(-8px)', transition: 'all 400ms ease' }}>
                                  <Flag size={11} style={{ color: '#B4552E', flexShrink: 0 }} />
                                  <span style={{ fontSize: 10.5, fontWeight: 650, color: '#B4552E', whiteSpace: 'nowrap', overflow: 'hidden' }}>Flight 9am</span>
                                </div>
                              )}
                              {dinnerThu && (
                                <div style={{ position: 'absolute', top: 8, left: 6, right: 6, background: '#C25A761E', borderLeft: '3px solid #C25A76', borderRadius: 8, padding: '5px 7px', transition: 'all 400ms ease' }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 650, color: '#C25A76' }}>vet recheck</div>
                                  <div style={{ fontSize: 9.5, color: '#6A6788' }}>5 pm</div>
                                </div>
                              )}
                              {col === 0 && (
                                <div style={{ position: 'absolute', left: 6, right: 6, bottom: 8, height: 38, background: IRIS + '14', border: `1.5px dashed ${IRIS}88`, borderRadius: 8, padding: '4px 7px', opacity: laundryTue ? 1 : 0, transform: laundryTue ? 'none' : 'translateY(10px)', transition: 'all 500ms cubic-bezier(.4,.1,.2,1)' }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 650, color: IRIS }}>laundry</div>
                                  <div style={{ fontSize: 9.5, color: '#6A6788' }}>evening</div>
                                </div>
                              )}
                              {col === 1 && (
                                <div style={{ position: 'absolute', left: 6, right: 6, bottom: 8, height: 38, background: IRIS + '14', border: `1.5px dashed ${IRIS}88`, borderRadius: 8, padding: '4px 7px', opacity: packWed ? 1 : 0, transform: packWed ? 'none' : 'translateY(10px)', transition: 'all 500ms cubic-bezier(.4,.1,.2,1)' }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 650, color: IRIS }}>pack</div>
                                  <div style={{ fontSize: 9.5, color: '#6A6788' }}>evening</div>
                                </div>
                              )}
                              {col === 2 && (
                                <>
                                  <div style={{ position: 'absolute', left: 6, right: 6, bottom: 50, height: 34, background: IRIS + '14', border: `1.5px dashed ${IRIS}88`, borderRadius: 8, padding: '3px 7px', opacity: laundryThu ? 1 : 0, transform: laundryThu ? 'none' : 'translateX(14px)', transition: 'all 450ms ease' }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 650, color: IRIS }}>laundry</div>
                                  </div>
                                  <div style={{ position: 'absolute', left: 6, right: 6, bottom: 8, height: 34, background: IRIS + '14', border: `1.5px dashed ${IRIS}88`, borderRadius: 8, padding: '3px 7px', opacity: packThu ? 1 : 0, transform: packThu ? 'none' : 'translateX(14px)', transition: 'all 450ms ease' }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 650, color: IRIS }}>pack</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {noteCard(FLIGHT_NOTE, dshown >= 6)}
                    <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 7, opacity: dshown >= 6 ? 1 : 0, transition: 'opacity 500ms ease 300ms' }}>
                      A last-minute appointment took Thursday, so the prep slid earlier — laundry first, then packing. The flight never budges.
                    </div>
                  </>
                )}

                {introSlide === 5 && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                      {LEARN_CHIPS.map((c, i) => {
                        const on = dshown > i;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 13px', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: 'all 380ms ease' }}>
                            <Sparkles size={14} style={{ color: IRIS, flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, color: '#3B3856', lineHeight: 1.4 }}>{c.obs}</div>
                              <div style={{ fontSize: 12, color: FERN, fontWeight: 550, marginTop: 2 }}>→ {c.act}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 10, background: '#F1F0FB', border: '1px solid #E3E1F7', borderRadius: 12, padding: '11px 13px', opacity: dshown >= LEARN_CHIPS.length ? 1 : 0, transform: dshown >= LEARN_CHIPS.length ? 'none' : 'translateY(8px)', transition: 'all 400ms ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Sparkles size={13} style={{ color: IRIS }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: IRIS }}>SUGGESTION</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#3B3856', lineHeight: 1.45, marginBottom: 8 }}>{LEARN_TIP}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', background: IRIS, borderRadius: 999, padding: '5px 14px' }}>Make it default</span>
                        <span style={{ fontSize: 11.5, color: MUTED, border: `1px solid ${LINE}`, borderRadius: 999, padding: '5px 14px' }}>Not now</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 10, opacity: dshown >= LEARN_CHIPS.length ? 1 : 0, transition: 'opacity 500ms ease 300ms' }}>
                      It notices your patterns — then adjusts, and suggests. No settings to tune.
                    </div>
                  </>
                )}

                {introSlide === 6 && (
                  <>
                    <div style={{ fontSize: 10.5, fontWeight: 650, letterSpacing: '0.06em', color: '#B8B5C6', marginBottom: 8 }}>OPTIONAL — OFF UNLESS YOU ASK</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#6A5AE01E', borderLeft: `3px solid ${IRIS}`, borderRadius: 10, padding: '10px 12px', opacity: dshown >= 1 ? 1 : 0, transition: 'all 350ms ease' }}>
                      <span style={{ fontSize: 13, fontWeight: 550, color: INK }}>Gym — Tue 9pm</span>
                      <span style={{ fontSize: 11, fontWeight: 650, color: IRIS }}>held</span>
                    </div>
                    <div style={{ margin: '10px 0', opacity: dshown >= 2 ? 1 : 0, transform: dshown >= 2 ? 'none' : 'translateY(8px)', transition: 'all 380ms ease' }}>
                      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 13px', boxShadow: '0 1px 3px rgba(34,34,59,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, color: '#B8B5C6' }}>9:35 pm</span>
                          <span style={{ fontSize: 10.5, color: '#B8B5C6' }}>Sprekta</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#3B3856', marginBottom: 8 }}>{ACC_NOTE}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: FERN, background: FERN + '14', border: `1px solid ${FERN}44`, borderRadius: 999, padding: '5px 14px' }}>Done ✓</span>
                          <span style={{ fontSize: 12, color: MUTED, border: `1px solid ${LINE}`, borderRadius: 999, padding: '5px 14px' }}>Not tonight</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 13px', opacity: dshown >= 3 ? 1 : 0, transform: dshown >= 3 ? 'none' : 'translateY(8px)', transition: 'all 380ms ease' }}>
                      <span style={{ fontSize: 12.5, color: '#4A4860' }}>This month</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1].map((v, i) => (
                          <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: v ? FERN : '#E2DFEE' }} />
                        ))}
                        <span style={{ fontSize: 12, fontWeight: 650, color: FERN, marginLeft: 6 }}>10 / 12</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4A4860', marginTop: 10, opacity: dshown >= 3 ? 1 : 0, transition: 'opacity 500ms ease 300ms' }}>
                      Some goals go better with a check-in. Turn it on for the ones that do.
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 4 }}>
                {Array.from({ length: LAST + 1 }).map((_, i) => (
                  <button key={i} onClick={() => setIntroSlide(i)} aria-label={`Slide ${i + 1}`}
                    style={{ width: 7, height: 7, borderRadius: 999, background: i === introSlide ? IRIS : '#D9D6E6', border: 'none', cursor: 'pointer', padding: 0, transform: i === introSlide ? 'scale(1.15)' : 'none', transition: 'all 200ms ease' }} />
                ))}
              </div>

              <button onClick={advance} style={{ fontFamily: SANS, marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 550, color: '#fff', background: INK, border: 'none', borderRadius: 12, padding: '12px 22px', cursor: 'pointer' }}>
                {introSlide < LAST ? 'Next' : 'Set me up'}<ArrowRight size={16} />
              </button>
              {introSlide < LAST && <SkipLink label="Skip to setup" onSkip={next} />}
            </Wrap>
          );
        })()}

        {step === 'name' && (
          <Wrap anim={anim}>
            <Q anim={anim}>First — what should I call you?</Q>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') next(); }} autoFocus
              placeholder="Rachel"
              style={{ fontFamily: SERIF, fontSize: 26, border: 'none', borderBottom: `2px solid ${name ? IRIS : LINE}`, background: 'transparent', outline: 'none', padding: '6px 2px', color: INK, width: '70%', transition: 'border-color 150ms' }} />
            <div><NextBtn onNext={next} label={name.trim() ? `Nice to meet you, ${first}` : 'Continue'} /></div>
            <SkipLink label="Skip for now" onSkip={next} />
          </Wrap>
        )}

        {step === 'work' && (
          <Wrap anim={anim}>
            <Q anim={anim}>What do you do for work?</Q>
            <Sub>This tells me which hours are spoken for — and where everything else has to fit.</Sub>
            <input value={jobTitle} onChange={e => onJobTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') next(); }}
              placeholder={'e.g. “grade-4 teacher” · “electrician, own crew” · “office job, 9 to 5”'}
              style={{ fontFamily: SANS, width: '100%', border: `1.5px solid ${jobTitle ? IRIS : LINE}`, borderRadius: 12, background: '#fff', outline: 'none', fontSize: 15, padding: '12px 14px', color: INK, marginBottom: 12, transition: 'border-color 150ms' }} />
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>or tap one:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {JOBTYPES.map(v => <Chip key={v} text={v} on={jobType === v} onTap={() => tapJobType(v)} />)}
            </div>
            {jobType === 'It varies' && (
              <div style={{ marginTop: 14 }}>
                <VoiceBox target="jobVaries" value={jobVaries} onChange={onJobVaries} rows={3}
                  voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
                  placeholder={'tell me how it varies — e.g. “contract gigs, some months packed, some open” · “two part-time jobs, schedules change weekly”'} />
              </div>
            )}
            {(jobTitle.trim() || jobType) && <NextBtn onNext={next} />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {step === 'days' && (
          <Wrap anim={anim}>
            <Q anim={anim}>What does your average Tuesday look like?</Q>
            <Sub>Where the time goes — what’s locked, what’s flexible. No average Tuesday? Describe how you usually break down or plan your week instead.</Sub>
            <VoiceBox target="wd" value={weekday} onChange={setWeekday} rows={3}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “up at 7, work till 1, errands midday if the timing works, evenings are mine — gym around 9”'} />
            <H2>And weekends?</H2>
            <VoiceBox target="we" value={weekend} onChange={setWeekend} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “saturday errands and family time, sunday stays quiet”'} />
            {voiceNote && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>{voiceNote}</div>}
            {(weekday.trim() || weekend.trim()) && <NextBtn onNext={next} />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {step === 'standing' && (
          <Wrap anim={anim}>
            <Q anim={anim}>What are the fixed points in your week?</Q>
            <Sub>Tap the slots that are usually spoken for — a shift, a class, the school run. I’ll plan everything else around them.</Sub>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              <div style={{ width: 52, flexShrink: 0 }} />
              {GRID_DAYS.map(d => <div key={d} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: MUTED, textAlign: 'center' }}>{d}</div>)}
            </div>
            {GRID_BANDS.map(band => (
              <div key={band} style={{ display: 'flex', gap: 3, marginBottom: 3, alignItems: 'stretch' }}>
                <div style={{ width: 52, flexShrink: 0, fontSize: 10, color: MUTED, display: 'flex', alignItems: 'center' }}>{band}</div>
                {GRID_DAYS.map(day => {
                  const on = gridCells[day + '-' + band];
                  return (
                    <button key={day} onClick={() => toggleCell(day, band)} aria-label={`${day} ${band}`}
                      style={{ flex: 1, height: 30, borderRadius: 7, cursor: 'pointer', border: `1px solid ${on ? IRIS : LINE}`, background: on ? IRIS + '22' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms ease', padding: 0 }}>
                      {on && <Lock size={11} style={{ color: IRIS }} />}
                    </button>
                  );
                })}
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <Sub>Want to name any of them? (optional)</Sub>
              <VoiceBox target="anchors" value={anchors} onChange={setAnchors} rows={2}
                voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
                placeholder={'e.g. “gym tuesday + thursday evenings” · “kids to school by 8, mon–fri” · “standup 9am weekdays”'} />
            </div>
            <H2>Any major responsibilities to keep track of?</H2>
            <Sub>The standing ones — I’ll factor them into every plan.</Sub>
            <VoiceBox target="resp" value={resp} onChange={onResp} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “the dog, rent and bills, my mom’s appointments”'} />
            {(Object.keys(gridCells).length > 0 || anchors.trim() || resp.trim()) && <NextBtn onNext={next} />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {step === 'protect' && (
          <Wrap anim={anim}>
            <Q anim={anim}>What do you want regular time for?</Q>
            <Sub>Goals and the good stuff — I’ll schedule it before the week fills up, even on weeks you don’t mention it.</Sub>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 14 }}>
              {PROTECT.map(v => <Chip key={v} text={v} on={protect.includes(v)} color={'#2E9E8F'} onTap={() => tapProtect(v)} />)}
            </div>
            <VoiceBox target="protectNote" value={protectNote} onChange={onProtectNote} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'or say it your way: “free up evenings for the kids” · “practice guitar more” · “date night every friday” · “gym 2–3x a week”'} />
            {(protect.length > 0 || protectNote.trim()) && <NextBtn onNext={next} />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {step === 'wish' && (
          <Wrap anim={anim}>
            <Q anim={anim}>Where does your planning usually break down?</Q>
            <Sub>The part that keeps tripping you up. Say it however it comes out — it’s the first thing I’ll work on.</Sub>
            <VoiceBox target="challenge" value={challenge} onChange={onChallenge} rows={3}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “I never protect time for the gym” · “everything piles onto one day” · “I forget the little errands until it’s too late” · “I overbook myself constantly”'} />
            <H2>And where could Sprekta help most?</H2>
            <Sub>Tap any that fit — this shapes how I handle your time.</Sub>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {WISHES.map(w => {
                const on = wishes.includes(w.key);
                return (
                  <button key={w.key} onClick={() => tapWish(w.key)} style={{
                    textAlign: 'left', padding: '11px 13px', borderRadius: 12, cursor: 'pointer', outline: 'none',
                    border: `1.5px solid ${on ? w.color : LINE}`, background: on ? w.color + '14' : '#fff', transition: 'all 130ms ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 15, color: on ? w.color : INK }}>{w.label}</span>
                      {on && <Check size={14} style={{ color: w.color, flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{w.sub}</div>
                  </button>
                );
              })}
            </div>
            {(challenge.trim() || wishes.length > 0) && <NextBtn onNext={next} label="Noted" />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {branch === 'life' && (
          <Wrap anim={anim}>
            <div style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B8B5C6', marginBottom: 6 }}>Optional</div>
            <Q anim={anim}>A bit about you.</Q>
            <H2 top={0}>Any hobbies or loves?</H2>
            <Sub>Shapes what I suggest and how I fill a free evening.</Sub>
            <VoiceBox target="loves" value={loves} onChange={onLoves} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “hockey, baking, true crime, tinkering in the garage”'} />
            <H2>Any major dislikes or non-negotiables?</H2>
            <VoiceBox target="nonos" value={nonos} onChange={onNonos} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “no early mornings” · “sundays stay free” · “never book me back-to-back”'} />
            <H2>Anything big coming up — or changed recently?</H2>
            <VoiceBox target="lifeBig" value={lifeBig} onChange={onLifeBig} rows={2}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “getting married in september” · “just started a new job” · “moved cities last month”'} />
            <button onClick={() => setBranch('people')} style={{ fontFamily: SANS, marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 550, color: '#fff', background: INK, border: 'none', borderRadius: 12, padding: '12px 22px', cursor: 'pointer' }}>Continue<ArrowRight size={16} /></button>
          </Wrap>
        )}

        {branch === 'people' && (
          <Wrap anim={anim}>
            <div style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B8B5C6', marginBottom: 6 }}>Optional</div>
            <Q anim={anim}>Any family or friends who play a major role day to day?</Q>
            <Sub>Names help — so the first time you write “pick up Emma,” I already know who that is.</Sub>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 14 }}>
              {PEOPLE.map(v => <Chip key={v} text={v} on={people.includes(v)} color={'#C25A76'} onTap={() => tapPeople(v)} />)}
            </div>
            {people.length > 0 && !people.includes('Just me') && (
              <VoiceBox target="peopleNote" value={peopleNote} onChange={onPeopleNote} rows={2}
                voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
                placeholder={'e.g. “my partner Sam” · “my sister watches the kids on thursdays”'} />
            )}
            <H2>And how do you usually get around?</H2>
            <Sub>Car days and transit days get planned differently — errands batch into loops that actually work.</Sub>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {RIDES.map(v => <Chip key={v} text={v} on={rides.includes(v)} onTap={() => tapRide(v)} />)}
            </div>
            {rides.includes('Other') && (
              <div style={{ marginTop: 14 }}>
                <VoiceBox target="rideOther" value={rideOther} onChange={onRideOther} rows={2}
                  voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
                  placeholder={'describe how you commute or travel — e.g. “bus most days, carpool fridays, rent a car for big errand runs”'} />
              </div>
            )}
            <button onClick={() => setBranch(null)} style={{ fontFamily: SANS, marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 550, color: '#fff', background: INK, border: 'none', borderRadius: 12, padding: '12px 22px', cursor: 'pointer' }}>Done — back to my week<ArrowRight size={16} /></button>
          </Wrap>
        )}

        {step === 'tomorrow' && !branch && (
          <Wrap anim={anim}>
            <Q anim={anim}>Last one{first ? `, ${first}` : ''} — what’s coming up this week?</Q>
            <Sub>Appointments, deadlines, to-dos, half-thoughts — any order. This becomes your first plan, built around everything you just told me.</Sub>
            <VoiceBox target="tomorrow" value={tomorrow} onChange={onTomorrow} rows={4}
              voiceTarget={voiceTarget} onToggleVoice={toggleVoice} registerVoice={registerVoice}
              placeholder={'e.g. “dentist thursday at 2, taxes, groceries, kids’ practice wednesday, gym twice if it fits”'} />
            <button onClick={() => setBranch('life')} style={{ fontFamily: SANS, display: 'block', marginTop: 12, fontSize: 13, color: IRIS, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Answer a few more optional questions to personalize further →</button>
            {tomorrow.trim() && <NextBtn onNext={next} label="Build my week" />}
            <SkipLink onSkip={next} />
          </Wrap>
        )}

        {step === 'read' && (
          <Wrap anim={anim}>
            <Q anim={anim}>{first ? `${first}, here’s` : 'Here’s'} what I’m holding.</Q>
            <Sub>Correct anything, anytime — I keep up. And this isn’t a one-time form: when something new shows up in what you jot down (a wedding, a move, a new job), I’ll notice and ask about it then.</Sub>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 8 }}>
              {ledger.map(e => (
                <div key={e.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 14px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: e.color, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#3B3856' }}>{e.text}</span>
                </div>
              ))}
              {ledger.length === 0 && <div style={{ fontSize: 14, color: MUTED }}>Nothing here yet — I’ll learn as we go.</div>}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 17, color: '#4A4860', lineHeight: 1.5, margin: '18px 0 4px' }}>
              {weekday.trim() ? 'Your days have a shape — I’ll build plans inside it, and guard what you told me about even on the loud weeks. Sound right?'
                : 'I’ll learn the shape of your days as we go — the plans get sharper every week.'}
            </div>
            <button onClick={handleSeeMyWeek} disabled={finishing} style={{ fontFamily: SANS, marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 550, color: '#fff', background: finishing ? '#B7B3DE' : IRIS, border: 'none', borderRadius: 12, padding: '12px 22px', cursor: finishing ? 'default' : 'pointer' }}><Sparkles size={16} />{finishing ? 'Building your week…' : 'See my week'}</button>

            <div style={{ marginTop: 30, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Keep me one tap away</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Add Sprekta to your home screen — it works like any other app.</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[['iphone', 'iPhone'], ['android', 'Android']].map(([k, label]) => (
                  <button key={k} onClick={() => setPlatform(k)} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${platform === k ? INK : LINE}`, background: platform === k ? INK : '#fff', color: platform === k ? '#fff' : MUTED }}>{label}</button>
                ))}
              </div>
              {platform === 'iphone' ? (
                <ol style={{ fontSize: 13.5, color: '#4A4860', lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
                  <li>Open <b>app.sprekta.com</b> in <b>Safari</b></li>
                  <li>Tap the <b>Share</b> button <Share size={13} style={{ verticalAlign: '-2px' }} /></li>
                  <li>Scroll down, tap <b>Add to Home Screen</b>, then <b>Add</b></li>
                </ol>
              ) : (
                <ol style={{ fontSize: 13.5, color: '#4A4860', lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
                  <li>Open <b>app.sprekta.com</b> in <b>Chrome</b></li>
                  <li>Tap the <b>⋮ menu</b> <MoreVertical size={13} style={{ verticalAlign: '-2px' }} /> in the top corner</li>
                  <li>Tap <b>Add to Home screen</b> (or <b>Install app</b>), then confirm</li>
                </ol>
              )}
            </div>
          </Wrap>
        )}
      </div>

      {step !== 'read' && (
        <div style={{ borderTop: `1px solid ${LINE}`, background: '#FFFFFFCC', backdropFilter: 'blur(4px)' }}>
          <div style={{ maxWidth: 620, margin: '0 auto', padding: '10px 24px 14px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>What Sprekta’s holding</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 84, overflowY: 'auto' }}>
              {ledger.length === 0
                ? <div style={{ fontSize: 13, color: '#B8B5C6' }}>Everything you share lands here.</div>
                : ledger.map(e => (
                  <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A4860' }}>
                    <Check size={12} style={{ color: e.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</span>
                  </div>
                ))}
              <div ref={ledgerEnd} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
