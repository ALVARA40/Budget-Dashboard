import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 560 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Settings</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>Manage your account and preferences</div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #FFB37C, #F25F5C)',
            color: 'white', display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 18,
          }}>AG</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Alejandro</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>a.alvarez332@gmail.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DISPLAY NAME</label>
            <input className="input" defaultValue="Alejandro" />
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

      {/* Currency & region */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>CURRENCY</label>
            <select className="input">
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="COP">COP — Colombian Peso</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DEFAULT VIEW</label>
            <select className="input">
              <option>Dashboard</option>
              <option>Budget Tracking</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '20px 24px', borderColor: 'var(--red-soft)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>Account</div>
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
