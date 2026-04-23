import { useState } from 'react';
import { STATIC_TRANSACTIONS } from '../lib/staticData';
import { fmt$, fmtDate } from '../lib/format';
import { Icon } from '../components/ui/Icon';
import type { Transaction } from '../types';

export function BudgetTracking() {
  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<string>('all');

  const filtered = STATIC_TRANSACTIONS.filter(t => {
    const matchKind =
      filterKind === 'all' ? true :
      filterKind === 'income' ? t.amount > 0 :
      filterKind === 'expense' ? t.amount < 0 : true;
    const matchSearch = !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.category?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchKind && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Budget Tracking</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
            {STATIC_TRANSACTIONS.length} transactions · April 2026
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} stroke="var(--ink-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' } as React.CSSProperties} />
            <input
              className="input"
              placeholder="Search transactions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: 220 }}
            />
          </div>
          <select
            className="input"
            value={filterKind}
            onChange={e => setFilterKind(e.target.value)}
            style={{ width: 130 }}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 140px 120px 110px 80px',
          gap: 12, padding: '10px 20px',
          borderBottom: '1px solid var(--line)',
          fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <div>Date</div>
          <div>Description</div>
          <div>Category</div>
          <div>Method</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
          <div></div>
        </div>

        {filtered.map((t, i) => (
          <div key={t.id} style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 140px 120px 110px 80px',
            gap: 12, padding: '12px 20px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtDate(t.date)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: t.amount > 0 ? 'var(--green-soft)' : 'var(--brand-soft)',
                color: t.amount > 0 ? 'var(--green)' : 'var(--brand)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name={t.amount > 0 ? 'arrowdown' : 'arrowup'} size={12} sw={2.2} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.description}</div>
            </div>
            <div>
              {t.category && (
                <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 999, background: 'var(--bg)', color: 'var(--ink-soft)' }}>
                  {t.category.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
              {t.method || '—'}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.amount > 0 ? 'var(--green)' : 'var(--ink)' }}>
              {t.amount > 0 ? '+' : ''}{fmt$(t.amount, { cents: true })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button style={{ color: 'var(--ink-muted)', cursor: 'pointer', padding: 4 }} title="Edit">
                <Icon name="edit" size={14} />
              </button>
              <button style={{ color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Delete">
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            No transactions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
