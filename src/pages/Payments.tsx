import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fmt$ } from '../lib/format';
import { Icon } from '../components/ui/Icon';
import type { Transaction } from '../types/index';

function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const GRID = '80px 1fr 120px 130px 150px 110px';
const PAGE_SIZE = 100;
const BATCH = 1000;

export function Payments({ year = 0, month = 0 }: { year?: number; month?: number }) {
  const [allTxns, setAllTxns]         = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('all');
  const [filterKind, setFilterKind]   = useState('expense'); // expenses only by default
  const [page, setPage]               = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      let all: Transaction[] = [];
      let offset = 0;
      while (true) {
        let q = supabase
          .from('transactions')
          .select('*, category:categories(*), bank:banks(*), company:companies(*)')
          .eq('user_id', session.user.id)
          .lt('amount', 0)                       // expenses / payments only
          .order('date', { ascending: false })
          .range(offset, offset + BATCH - 1);

        if (year > 0 && month > 0) {
          const from = `${year}-${String(month).padStart(2,'0')}-01`;
          const to   = new Date(year, month, 0).toISOString().slice(0,10);
          q = q.gte('date', from).lte('date', to);
        }

        const { data } = await q;
        if (!data || data.length === 0) break;
        all = all.concat(data as Transaction[]);
        if (data.length < BATCH) break;
        offset += BATCH;
      }

      if (!cancelled) {
        setAllTxns(all);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  // Derived filter options
  const allCats = Array.from(new Set(
    allTxns.map(t => (t.category as { name?: string } | null)?.name).filter(Boolean)
  )).sort() as string[];

  // Filtered view
  const filtered = allTxns.filter(t => {
    const catName = (t.category as { name?: string } | null)?.name ?? '';
    const catKind = (t.category as { kind?: string } | null)?.kind ?? '';
    if (filterKind !== 'all' && filterKind === 'needs'   && catKind !== 'need')    return false;
    if (filterKind !== 'all' && filterKind === 'wants'   && catKind !== 'want')    return false;
    if (filterCat !== 'all' && catName !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      const desc = t.description?.toLowerCase() ?? '';
      if (!desc.includes(q) && !catName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pageCount   = Math.ceil(filtered.length / PAGE_SIZE);
  const visible     = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalAmount = filtered.reduce((s, t) => s + Math.abs(t.amount), 0);

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    background: active ? 'var(--brand)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--ink-soft)',
    borderColor: active ? 'var(--brand)' : 'var(--line)',
    transition: 'all 0.12s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Payments</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
          {loading ? 'Loading…' : (
            filtered.length + ' payment' + (filtered.length !== 1 ? 's' : '') +
            ' · ' + fmt$(totalAmount) + ' total'
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 999, padding: '7px 14px', flex: '1 1 200px', maxWidth: 280,
        }}>
          <Icon name="search" size={14} stroke="var(--ink-muted)" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search payments…"
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontFamily: 'inherit', fontSize: 12.5, color: 'var(--ink)',
              width: '100%',
            }}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1 }}>×</span>
          )}
        </div>

        {/* Kind filter chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 'all',   label: 'All' },
            { value: 'needs', label: 'Needs' },
            { value: 'wants', label: 'Wants' },
          ].map(opt => (
            <div key={opt.value} onClick={() => { setFilterKind(opt.value); setPage(0); }} style={chipStyle(filterKind === opt.value)}>
              {opt.label}
            </div>
          ))}
        </div>

        {/* Category select */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 999, padding: '6px 14px',
        }}>
          <Icon name="filter" size={13} stroke="var(--ink-soft)" />
          <select
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(0); }}
            style={{
              border: 'none', background: 'none', fontFamily: 'inherit',
              fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">All categories</option>
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Totals summary row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total payments',  value: fmt$(totalAmount), color: '#D8443F' },
            { label: 'Transactions',    value: filtered.length.toLocaleString(), color: 'var(--ink)' },
            { label: 'Avg. per payment', value: filtered.length > 0 ? fmt$(totalAmount / filtered.length) : '—', color: 'var(--ink)' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: GRID, gap: 12,
          padding: '11px 20px',
          borderBottom: '1px solid var(--line)',
          fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span>Bank</span>
          <span>Company</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            Loading payments…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            No payments match your filters.
          </div>
        ) : (
          visible.map((t, i) => {
            const catName    = (t.category as { name?: string } | null)?.name ?? '—';
            const catKind    = (t.category as { kind?: string } | null)?.kind ?? '';
            const bankName   = (t.bank    as { name?: string } | null)?.name ?? '—';
            const compName   = (t.company as { name?: string } | null)?.name ?? '—';

            const kindColors: Record<string, { bg: string; color: string }> = {
              need:    { bg: '#EFEBFF', color: '#7C5CFC' },
              want:    { bg: '#FBF1D8', color: '#E6A214' },
              savings: { bg: '#E3F5EC', color: '#1F9D6E' },
              income:  { bg: '#E3F5EC', color: '#1F9D6E' },
            };
            const kc = kindColors[catKind] ?? { bg: 'var(--bg)', color: 'var(--ink-soft)' };

            return (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: GRID, gap: 12,
                padding: '10px 20px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                alignItems: 'center',
                fontSize: 12.5,
              }}>
                <span style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                  {fmtDateShort(t.date)}
                </span>
                <span style={{ color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description}
                </span>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 9px', borderRadius: 999,
                    background: kc.bg, color: kc.color,
                    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110,
                  }}>
                    {catName}
                  </span>
                </div>
                <span style={{ color: 'var(--ink-soft)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bankName}
                </span>
                <span style={{ color: 'var(--ink-soft)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {compName}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#D8443F' }}>
                  {fmt$(t.amount, { cents: true })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--line)', background: 'var(--surface)', color: page === 0 ? 'var(--ink-muted)' : 'var(--ink)',
              cursor: page === 0 ? 'default' : 'pointer',
            }}
          >← Prev</button>
          <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            Page {page + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--line)', background: 'var(--surface)', color: page >= pageCount - 1 ? 'var(--ink-muted)' : 'var(--ink)',
              cursor: page >= pageCount - 1 ? 'default' : 'pointer',
            }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
