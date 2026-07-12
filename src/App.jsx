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
            <div style={{ fontSize: 14, color: INK, lineHeight: 1.6 }}>
              Check <b>{email}</b> for a magic link — click it to sign in.
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
