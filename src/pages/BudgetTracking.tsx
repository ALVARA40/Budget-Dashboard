import { useState } from 'react';
import { STATIC_TRANSACTIONS } from '../lib/staticData';
import { fmt$ } from '../lib/format';
import { Icon } from '../components/ui/Icon';

// 50/30/20 kind → label + color + badge style
const KIND_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  need:    { label: 'Need',    bg: '#EFEBFF', color: '#7C5CFC' },
  want:    { label: 'Want',    bg: '#FBF1D8', color: '#E6A214' },
  savings: { label: 'Savings', bg: '#E3F5EC', color: '#1F9D6E' },
  income:  { label: 'Income',  bg: '#E3F5EC', color: '#1F9D6E' },
};

function KindBadge({ kind }: { kind: string }) {
  const cfg = KIND_CONFIG[kind] ?? { label: kind, bg: '#F5F4FB', color: '#6B6780' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// Format date as "Apr 22" (no year) matching Excel display
function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format year only
function fmtYear(iso: string) {
  return new Date(iso + 'T12:00:00').getFullYear().toString();
}

const COLS = [
  { key: 'date',    label: 'Date',      width: '72px'  },
  { key: 'year',    label: 'Year',      width: '52px'  },
  { key: 'cat',     label: 'Category',  width: '1fr'   },
  { key: 'kind',    label: '50/30/20',  width: '88px'  },
  { key: 'bank',    label: 'Bank',      width: '120px' },
  { key: 'company', label: 'Company',   width: '130px' },
  { key: 'desc',    label: 'Description', width: '1fr' },
  { key: 'amount',  label: 'Amount',    width: '110px' },
  { key: 'actions', label: '',          width: '60px'  },
];

const GRID = COLS.map(c => c.width).join(' ');

export function BudgetTracking() {
  const [search, setSearch]       = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const [filterCat,  setFilterCat]  = useState('all');

  // Unique categories for filter dropdown
  const allCats = Array.from(
    new Set(STATIC_TRANSACTIONS.map(t => t.category?.name ?? '').filter(Boolean))
  ).sort();

  const filtered = STATIC_TRANSACTIONS.filter(t => {
    const kind = t.category?.kind ?? '';
    const matchKind =
      filterKind === 'all'     ? true :
      filterKind === 'income'  ? kind === 'income' :
      filterKind === 'expense' ? kind !== 'income' && kind !== 'savings' :
      filterKind === 'savings' ? kind === 'savings' : true;
    const matchCat = filterCat === 'all' || (t.category?.name ?? '') === filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.description.toLowerCase().includes(q) ||
      (t.category?.name  ?? '').toLowerCase().includes(q) ||
      (t.bank?.name      ?? '').toLowerCase().includes(q) ||
      (t.company?.name   ?? '').toLowerCase().includes(q);
    return matchKind && matchCat && matchSearch;
  });

  // Totals for footer
  const totalIncome   = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Budget Tracking
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
            {filtered.length} of {STATIC_TRANSACTIONS.length} transactions · April 2026
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Icon name="search" size={14} stroke="var(--ink-muted)" />
            </span>
            <input
              className="input"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: 180 }}
            />
          </div>

          {/* Type filter */}
          <select className="input" value={filterKind} onChange={e => setFilterKind(e.target.value)} style={{ width: 130 }}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
            <option value="savings">Savings</option>
          </select>

          {/* Category filter */}
          <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 160 }}>
            <option value="all">All categories</option>
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Income',   value: totalIncome,   bg: '#E3F5EC', color: '#1F9D6E' },
          { label: 'Expenses', value: totalExpenses, bg: '#FDEAE9', color: '#D8443F' },
          { label: 'Net',      value: totalIncome + totalExpenses, bg: '#EFEBFF', color: '#7C5CFC' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: s.bg, borderRadius: 10, padding: '8px 14px',
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              {s.value > 0 ? '+' : ''}{fmt$(s.value, { cents: true })}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: GRID,
          gap: 10, padding: '10px 18px',
          borderBottom: '1px solid var(--line)',
          fontSize: 10.5, fontWeight: 700, color: 'var(--ink-muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {COLS.map(c => <div key={c.key}>{c.label}</div>)}
        </div>

        {/* Rows */}
        {filtered.map((t, i) => {
          const kind = t.category?.kind ?? 'want';
          return (
            <div
              key={t.id}
              style={{
                display: 'grid', gridTemplateColumns: GRID,
                gap: 10, padding: '11px 18px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Date (e.g. "Apr 22") */}
              <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {fmtDateShort(t.date)}
              </div>

              {/* Year */}
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtYear(t.date)}
              </div>

              {/* Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: t.amount > 0 ? 'var(--green-soft)' : 'var(--brand-soft)',
                  color: t.amount > 0 ? 'var(--green)' : 'var(--brand)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={t.amount > 0 ? 'arrowdown' : 'arrowup'} size={12} sw={2.2} />
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.category?.name ?? '—'}
                </span>
              </div>

              {/* 50/30/20 kind badge */}
              <div>
                <KindBadge kind={kind} />
              </div>

              {/* Bank */}
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.bank?.name ?? '—'}
              </div>

              {/* Company */}
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.company?.name ?? '—'}
              </div>

              {/* Description */}
              <div style={{ fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.description}
              </div>

              {/* Amount */}
              <div style={{
                fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: t.amount > 0 ? 'var(--green)' : 'var(--ink)',
                textAlign: 'right',
              }}>
                {t.amount > 0 ? '+' : ''}{fmt$(t.amount, { cents: true })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <button style={{ color: 'var(--ink-muted)', cursor: 'pointer', padding: 4, background: 'none', border: 'none' }} title="Edit">
                  <Icon name="edit" size={13} />
                </button>
                <button style={{ color: 'var(--red)', cursor: 'pointer', padding: 4, background: 'none', border: 'none' }} title="Delete">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            No transactions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
