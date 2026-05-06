import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [banks, setBanks]             = useState<{ name: string }[]>([]);

  // Load real user data on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? '');
      setDisplayName(data.user.user_metadata?.display_name ?? data.user.email?.split('@')[0] ?? '');
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from('banks')
        .select('name')
        .eq('user_id', session.user.id)
        .order('name');
      if (data) setBanks(data);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 880 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Settings</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>Manage your account and preferences</div>
      </div>

      {/* Account / Profile */}
      <div className="card" style={{ padding: '24px 26px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Account</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2, marginBottom: 16 }}>Profile details and plan</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #FFB37C, #F25F5C)',
            color: '#fff', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 17,
          }}>{initials || '?'}</div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700 }}>{displayName || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{email} &middot; Personal plan</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DISPLAY NAME</label>
            <input
              className="input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input
              className="input"
              value={email}
              type="email"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title="Email cannot be changed here"
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button
            className="btn-primary"
            style={{ borderRadius: 10 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Data sources — real banks from Supabase */}
      <div className="card" style={{ padding: '24px 26px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Data sources</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2, marginBottom: 16 }}>Banks connected to your account</div>
        {banks.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', padding: '12px 0' }}>No banks found.</div>
        ) : banks.map(b => (
          <div key={b.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderTop: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{b.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--green)', display: 'inline-block' }} />
              Connected
            </div>
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div className="card" style={{ padding: '24px 26px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Preferences</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2, marginBottom: 16 }}>Currency, locale, budget period</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['CURRENCY',       'USD - $'],
            ['LOCALE',         'en-US'],
            ['START OF MONTH', '1st'],
            ['NOTIFICATIONS',  'Weekly summary'],
          ].map(([l, v]) => (
            <div key={l} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Account actions */}
      <div className="card" style={{ padding: '20px 24px', borderColor: 'var(--red-soft)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>Account actions</div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid var(--red)',
            background: 'var(--red-soft)', color: 'var(--red)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
