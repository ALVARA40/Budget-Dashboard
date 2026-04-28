import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

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
          }}>AA</div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700 }}>Alejandro Alvarez</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>a.alvarez332@gmail.com &middot; Personal plan</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)',
            padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Edit profile</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DISPLAY NAME</label>
            <input className="input" defaultValue="Alejandro Alvarez" />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input className="input" defaultValue="a.alvarez332@gmail.com" type="email" />
          </div>
        </div>
        <button className="btn-primary" style={{ marginTop: 16, borderRadius: 10 }}>
          Save changes
        </button>
      </div>

      {/* Data sources */}
      <div className="card" style={{ padding: '24px 26px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Data sources</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2, marginBottom: 16 }}>Banks and services connected via Supabase</div>
        {[
          { name: 'Chase',           status: 'Connected',     color: 'var(--green)' },
          { name: 'Bank of America', status: 'Connected',     color: 'var(--green)' },
          { name: 'Wells Fargo',     status: 'Connected',     color: 'var(--green)' },
          { name: 'Bancolombia',     status: 'Needs re-auth', color: '#E6A214' },
        ].map(s => (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderTop: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{s.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: s.color, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color, display: 'inline-block' }} />
                {s.status}
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Manage</div>
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

      {/* Danger zone */}
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
