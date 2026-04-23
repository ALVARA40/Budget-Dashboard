import { Icon } from '../ui/Icon';
import { MONTH_NAMES } from '../../lib/format';

interface Props {
  onAddEntry: () => void;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}

const YEARS = [2024, 2025, 2026];

export function Header({ onAddEntry, selectedYear, selectedMonth, onYearChange, onMonthChange }: Props) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 28px 18px',
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Welcome back, Alejandro
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
          Here's where your money went in{' '}
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </b>.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Year + Month selectors */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 999, padding: '6px 12px',
          fontSize: 12.5, fontWeight: 500, color: 'var(--ink)',
        }}>
          <Icon name="calendar" size={13} stroke="var(--ink-soft)" />
          <select
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
            style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none' }}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ color: 'var(--ink-muted)' }}>·</span>
          <select
            value={selectedMonth}
            onChange={e => onMonthChange(Number(e.target.value))}
            style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none' }}
          >
            {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
        </div>

        {/* Filter chips */}
        {[
          { label: 'Category', iconPath: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></> },
          { label: 'Bank', iconPath: <><path d="M3 10l9-6 9 6"/><path d="M5 10v9M12 10v9M19 10v9M3 21h18"/></> },
          { label: 'Company', iconPath: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3"/><path d="M3 13h18"/></> },
        ].map(chip => (
          <button key={chip.label} className="chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {chip.iconPath}
            </svg>
            {chip.label}
            <Icon name="chev" size={11} stroke="var(--ink-muted)" />
          </button>
        ))}

        {/* Search */}
        <button style={{
          width: 34, height: 34, borderRadius: 999,
          background: 'var(--surface)', border: '1px solid var(--line)',
          display: 'grid', placeItems: 'center', color: 'var(--ink-soft)', cursor: 'pointer',
        }}>
          <Icon name="search" size={15} />
        </button>

        {/* Add entry */}
        <button className="btn-primary" onClick={onAddEntry}>
          <Icon name="plus" size={14} sw={2.2} stroke="#fff" />
          Add entry
        </button>
      </div>
    </header>
  );
}
