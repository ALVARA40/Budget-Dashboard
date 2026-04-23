import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';

const NAV_ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: '/',                label: 'Dashboard',       icon: 'dashboard' },
  { path: '/budget-planning', label: 'Budget Planning', icon: 'planning'  },
  { path: '/budget-tracking', label: 'Budget Tracking', icon: 'tracking'  },
  { path: '/50-30-20',        label: '50 / 30 / 20',    icon: 'split'     },
  { path: '/analytics',       label: 'Analytics',       icon: 'analytics' },
];

export function Sidebar() {
  return (
    <aside style={{
      width: 224, background: 'var(--surface)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', padding: '22px 14px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'linear-gradient(135deg, var(--brand) 0%, #A98CFF 100%)',
          display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 14,
        }}>B</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Budget<span style={{ color: 'var(--brand)' }}>.</span>
        </div>
      </div>

      <div style={{
        fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 600,
        letterSpacing: '0.08em', padding: '0 10px 8px',
      }}>
        MENU
      </div>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 11px', borderRadius: 10, marginBottom: 2,
            background: isActive ? 'var(--brand)' : 'transparent',
            color: isActive ? '#fff' : 'var(--ink-soft)',
            fontSize: 13.5, fontWeight: isActive ? 600 : 500,
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} size={17} sw={isActive ? 2 : 1.7} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* Settings link */}
      <NavLink
        to="/settings"
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '10px 11px', borderRadius: 10, marginBottom: 8,
          color: isActive ? 'var(--brand)' : 'var(--ink-soft)',
          fontSize: 13.5, fontWeight: 500,
          textDecoration: 'none',
        })}
      >
        <Icon name="settings" size={17} />
        Settings
      </NavLink>

      {/* User card */}
      <div style={{
        background: 'var(--bg)', borderRadius: 12, padding: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #FFB37C, #F25F5C)',
          color: 'white', display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 12,
        }}>AG</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Alejandro</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Personal plan</div>
        </div>
      </div>
    </aside>
  );
}
