import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient.js';
import Sprekta from './Sprekta.jsx';

const INK = '#22223B', PAPER = '#FAF9F6', GREEN = '#12886A', AI = '#6A5AE0', MUTED = '#77748A', LINE = '#E7E4DC';

export default function App() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendLink(e) {
    e.preventDefault();
    if (sending) return;
    setAuthError('');
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) setAuthError(error.message);
    else setSent(true);
  }

  // On iOS, a home-screen PWA and Safari are separate storage sandboxes —
  // tapping the emailed link opens (and signs in) Safari, not the installed
  // app, and there's no way to force the link to open the PWA instead.
  // The code is the same OTP the link encodes, just enterable by hand
  // inside whichever surface the person is actually using — this is what
  // makes "install once, log in once" work on iPhone.
  async function verifyCode(e) {
    e.preventDefault();
    if (verifying || code.trim().length < 6) return;
    setVerifyError('');
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setVerifying(false);
    if (error) setVerifyError(error.message);
  }

  function useDifferentEmail() {
    setSent(false);
    setCode('');
    setVerifyError('');
    setAuthError('');
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!checked) return null;

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAPER, fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: INK, marginBottom: 6, letterSpacing: '-0.02em' }}>
            Sprekta<span style={{ color: GREEN }}>.</span>
          </div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>Your calm second brain.</div>
          {sent ? (
            <div>
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.6, marginBottom: 16 }}>
                Check <b>{email}</b> — click the link (on a computer), or enter the 6-digit code below (on your phone, especially if you've added Sprekta to your home screen).
              </div>
              <form onSubmit={verifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', fontSize: 22, letterSpacing: '6px', textAlign: 'center', outline: 'none', fontFamily: 'inherit', background: '#fff', color: INK }}
                />
                <button
                  type="submit"
                  disabled={verifying || code.trim().length < 6}
                  style={{ background: (verifying || code.trim().length < 6) ? '#9A96C9' : AI, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 500, cursor: (verifying || code.trim().length < 6) ? 'default' : 'pointer' }}
                >
                  {verifying ? 'Checking…' : 'Enter code'}
                </button>
                {verifyError && <div style={{ fontSize: 12.5, color: '#B23' }}>{verifyError}</div>}
                <button type="button" onClick={useDifferentEmail} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  Use a different email
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={sendLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: INK }}
              />
              <button
                type="submit"
                disabled={sending}
                style={{ background: sending ? '#9A96C9' : AI, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 500, cursor: sending ? 'default' : 'pointer' }}
              >
                {sending ? 'Sending…' : 'Send me a link'}
              </button>
              {authError && <div style={{ fontSize: 12.5, color: '#B23' }}>{authError}</div>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return <Sprekta session={session} onSignOut={signOut} />;
}
