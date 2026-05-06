import { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { MONTH_NAMES } from '../../lib/format';
import type { GlobalFilters } from '../../App';

interface Props {
  onAddEntry: () => void;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  categoryOptions: string[];
  bankOptions: string[];
  companyOptions: string[];
  filters: GlobalFilters;
  onFiltersChange: (f: GlobalFilters) => void;
}

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR - 2, THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1];

function FilterDropdown({
  label, icon, options, value, onChange,
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== 'All';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="chip"
        onClick={() => setOpen(v => !v)}
        style={{
          background: active ? 'var(--brand-soft)' : undefined,
          color: active ? 'var(--brand)' : undefined,
          border: active ? '1px solid var(--brand)' : undefined,
          fontWeight: active ? 700 : undefined,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={active ? 'var(--brand)' : 'var(--ink-soft)'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
        {active ? value : `All ${label.toLowerCase()}s`}
        <Icon name="chev" size={11} stroke={active ? 'var(--brand)' : 'var(--ink-muted)'} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 12, boxShadow: '0 14px 40px -10px rgba(15,14,26,0.22)',
          padding: '4px 0', minWidth: 200, maxHeight: 280, overflowY: 'auto',
        }}>
          {['All', ...options].map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt === 'All' ? 'All' : opt); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: 12.5, cursor: 'pointer',
                color: value === opt || (opt === 'All' && value === 'All') ? 'var(--brand)' : 'var(--ink)',
                fontWeight: value === opt || (opt === 'All' && value === 'All') ? 600 : 400,
                background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {(value === opt || (opt === 'All' && value === 'All')) && (
                <span style={{ color: 'var(--brand)', fontSize: 10 }}>✓</span>
              )}
              {opt === 'All' ? `All ${label.toLowerCase()}s` : opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({
  onAddEntry, selectedYear, selectedMonth, onYearChange, onMonthChange,
  categoryOptions, bankOptions, companyOptions, filters, onFiltersChange,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const hasFilter = filters.category !== 'All' || filters.bank !== 'All' || filters.company !== 'All' || filters.search !== '';

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  function set(key: keyof GlobalFilters, val: string) {
    onFiltersChange({ ...filters, [key]: val });
  }

  function clearAll() {
    onFiltersChange({ category: 'All', bank: 'All', company: 'All', search: '' });
    setShowSearch(false);
  }

  return (
    <header style={{ padding: '22px 28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Welcome back, Alejandro Alvarez
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
            <select value={selectedYear} onChange={e => onYearChange(Number(e.target.value))}
              style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none' }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ color: 'var(--ink-muted)' }}>·</span>
            <select value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))}
              style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none' }}>
              {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
            </select>
          </div>

          {/* Category dropdown */}
          <FilterDropdown
            label="Category"
            icon={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>}
            options={categoryOptions}
            value={filters.category}
            onChange={v => set('category', v)}
          />

          {/* Bank dropdown */}
          <FilterDropdown
            label="Bank"
            icon={<><path d="M3 10l9-6 9 6"/><path d="M5 10v9M12 10v9M19 10v9M3 21h18"/></>}
            options={bankOptions}
            value={filters.bank}
            onChange={v => set('bank', v)}
          />

          {/* Company dropdown */}
          <FilterDropdown
            label="Company"
            icon={<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3"/><path d="M3 13h18"/></>}
            options={companyOptions}
            value={filters.company}
            onChange={v => set('company', v)}
          />

          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(v => !v)}
            title="Search transactions"
            style={{
              width: 34, height: 34, borderRadius: 999,
              background: (showSearch || filters.search) ? 'var(--brand-soft)' : 'var(--surface)',
              border: '1px solid ' + ((showSearch || filters.search) ? 'var(--brand)' : 'var(--line)'),
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
            <Icon name="search" size={15} stroke={(showSearch || filters.search) ? 'var(--brand)' : 'var(--ink-soft)'} />
          </button>

          {/* Clear all filters */}
          {hasFilter && (
            <button onClick={clearAll} style={{
              fontSize: 11.5, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-soft)',
              fontFamily: 'inherit', fontWeight: 500,
            }}>Clear filters</button>
          )}

          {/* Add entry */}
          <button className="btn-primary" onClick={onAddEntry}>
            <Icon name="plus" size={14} sw={2.2} stroke="#fff" />
            Add entry
          </button>
        </div>
      </div>

      {/* Search bar — slides in below header row */}
      {showSearch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          background: 'var(--surface)', border: '1px solid var(--brand)',
          borderRadius: 10, padding: '9px 14px',
        }}>
          <Icon name="search" size={14} stroke="var(--brand)" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="Search by description, category, bank, or company…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
          {filters.search && (
            <button onClick={() => set('search', '')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-muted)', fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>
      )}
    </header>
  );
}
