import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      navigate('/');
    }
  }

  // Demo mode: bypass login if no Supabase configured
  function handleDemo() {
    navigate('/');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--bg)', fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, var(--brand) 0%, #A98CFF 100%)',
            display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 17,
          }}>B</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Budget<span style={{ color: 'var(--brand)' }}>.</span>
          </div>
        </div>

        <div className="card" style={{ padding: '32px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 6, textAlign: 'center', letterSpacing: '-0.02em' }}>
            Welcome back
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 24 }}>
            Sign in to your Budget Dashboard
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>EMAIL</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>PASSWORD</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 12.5, fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', borderRadius: 10, padding: '12px 0', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 10 }}>— or —</div>
            <button
              onClick={handleDemo}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                border: '1px solid var(--line)', background: 'var(--bg)',
                color: 'var(--ink-soft)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              View demo (no login)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--ink-muted)' }}>
          Your data is private and encrypted. Powered by Supabase.
        </div>
      </div>
    </div>
  );
}
