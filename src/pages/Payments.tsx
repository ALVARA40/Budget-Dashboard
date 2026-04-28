import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fmt$ } from '../lib/format';
import { Icon } from '../components/ui/Icon';
import { Dropdown } from '../components/ui/Dropdown';
import type { Transaction } from '../types/index';

const BATCH = 1000;
const BANK_COLORS = ['#7C5CFC','#33C58A','#3B7BCE','#F5B544','#D8443F','#1F3F8A','#E6A214','#7FB3E8'];

function fmtDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function KpiMini({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function SortHeader({ label, sortKey, currentKey, dir, onSort, align = 'left' }: {
  label: string; sortKey: string; currentKey: string; dir: 'asc' | 'desc';
  onSort: (k: string) => void; align?: 'left' | 'right';
}) {
  const active = sortKey === currentKey;
  return (
    <div onClick={() => onSort(sortKey)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
      color: active ? 'var(--brand)' : 'var(--ink-muted)',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      width: '100%', userSelect: 'none',
    }}>
      {label}
      {active && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
    </div>
  );
}

function PageBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      color: disabled ? 'var(--ink-muted)' : 'var(--ink)',
      padding: '5px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, userSelect: 'none',
    }}>{label}</div>
  );
}

export function Payments({ year = 0, month = 0 }: { year?: number; month?: number }) {
  const [allTxns, setAllTxns]   = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterBank, setFilterBank] = useState('All banks');
  const [sortKey, setSortKey]   = useState('date');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [page, setPage]         = useState(1);
  const perPage = 50;

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
          .lt('amount', 0)
          .order('date', { ascending: false })
          .range(offset, offset + BATCH - 1);
        if (year > 0 && month > 0) {
          const from = year + '-' + String(month).padStart(2,'0') + '-01';
          const to   = new Date(year, month, 0).toISOString().slice(0,10);
          q = q.gte('date', from).lte('date', to);
        }
        const { data } = await q;
        if (!data || data.length === 0) break;
        all = all.concat(data as Transaction[]);
        if (data.length < BATCH) break;
        offset += BATCH;
      }
      if (!cancelled) { setAllTxns(all); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  useEffect(() => { setPage(1); }, [search, filterBank]);

  const allBanks = useMemo(() =>
    Array.from(new Set(allTxns.map(t => (t.bank as {name?:string}|null)?.name ?? '').filter(Boolean))).sort(),
    [allTxns]
  );

  const filtered = useMemo(() => {
    let out = allTxns.filter(t => {
      const bankName = (t.bank as {name?:string}|null)?.name ?? '';
      if (filterBank !== 'All banks' && bankName !== filterBank) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!bankName.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === 'date')   return (a.date > b.date ? 1 : -1) * dir;
      if (sortKey === 'amount') return (Math.abs(a.amount) - Math.abs(b.amount)) * dir;
      if (sortKey === 'bank')   return (((a.bank as {name?:string}|null)?.name ?? '') > ((b.bank as {name?:string}|null)?.name ?? '') ? 1 : -1) * dir;
      return 0;
    });
  }, [allTxns, search, filterBank, sortKey, sortDir]);

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(k === 'date' || k === 'amount' ? 'desc' : 'asc'); }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safeP      = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safeP - 1) * perPage, safeP * perPage);
  const startIdx   = filtered.length === 0 ? 0 : (safeP - 1) * perPage + 1;
  const endIdx     = Math.min(safeP * perPage, filtered.length);

  const totalAmount = filtered.reduce((s,t) => s + Math.abs(t.amount), 0);
  const avgAmount   = filtered.length ? totalAmount / filtered.length : 0;
  const largest     = filtered.length ? Math.max(...filtered.map(t => Math.abs(t.amount))) : 0;

  // By bank breakdown
  const byBank = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filtered.forEach(t => {
      const name = (t.bank as {name?:string}|null)?.name ?? 'Unknown';
      if (!map[name]) map[name] = { total: 0, count: 0 };
      map[name].total += Math.abs(t.amount);
      map[name].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a,b) => b.total - a.total);
  }, [filtered]);

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 10px',
    fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.05em',
    borderBottom: '1px solid var(--line)', background: 'var(--surface)', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiMini label="Payments"     value={filtered.length.toLocaleString()} sub={search || filterBank !== 'All banks' ? 'of ' + allTxns.length + ' total' : 'All-time history'} color="var(--brand)" />
        <KpiMini label="Total volume" value={fmt$(totalAmount)}                sub={filtered.length + ' payments'} color="var(--green)" />
        <KpiMini label="Avg payment"  value={fmt$(avgAmount)}                  sub="Per transaction"   color="#4BA3F7" />
        <KpiMini label="Largest"      value={fmt$(largest)}                    sub="Single payment"    color="var(--red)" />
      </div>

      {/* By bank breakdown */}
      {!loading && byBank.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>By bank</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byBank.map((b, i) => {
              const pct = totalAmount > 0 ? (b.total / totalAmount) * 100 : 0;
              const c = BANK_COLORS[i % BANK_COLORS.length];
              return (
                <div key={b.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink)', fontWeight: 500 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />
                      {b.name}
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>· {b.count} payments</span>
                    </span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt$(b.total)} <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>· {pct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: c, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg)', border: '1px solid var(--line)',
          borderRadius: 999, padding: '7px 14px', minWidth: 220,
        }}>
          <Icon name="search" size={13} stroke="var(--ink-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bank or description…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', flex: 1, fontFamily: 'inherit' }} />
          {search && <span onClick={() => setSearch('')} style={{ color: 'var(--ink-muted)', cursor: 'pointer', fontSize: 14 }}>×</span>}
        </div>
        <Dropdown label="Bank" value={filterBank} options={['All banks', ...allBanks]} onChange={setFilterBank} />
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          Showing <b style={{ color: 'var(--ink)' }}>{filtered.length.toLocaleString()}</b> of <b style={{ color: 'var(--ink)' }}>{allTxns.length.toLocaleString()}</b> payments
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', maxHeight: '60vh' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface)' }}>
                <th style={{ ...thStyle, width: 140 }}><SortHeader label="DATE"   sortKey="date"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={thStyle}                   ><SortHeader label="BANK"   sortKey="bank"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={{ ...thStyle, width: 160, textAlign: 'right' }}><SortHeader label="AMOUNT" sortKey="amount" currentKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" /></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading payments…</td></tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>No payments match these filters.</td></tr>
              )}
              {!loading && pageRows.map((t, i) => {
                const bankName = (t.bank as {name?:string}|null)?.name ?? '–';
                return (
                  <tr key={t.id} style={{ background: i % 2 ? 'var(--bg)' : 'var(--surface)' }}>
                    <td style={{ padding: '11px 10px', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                    <td style={{ padding: '11px 10px', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>{bankName}</td>
                    <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)', borderBottom: '1px solid var(--line)' }}>
                      {fmt$(Math.abs(t.amount), { cents: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)', gap: 10,
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
            {loading ? 'Loading…' : (<>
              Page <b style={{ color: 'var(--ink)' }}>{safeP}</b> of <b style={{ color: 'var(--ink)' }}>{totalPages}</b>
              {' '}· {startIdx}–{endIdx} of {filtered.length.toLocaleString()}
            </>)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PageBtn disabled={safeP === 1}          onClick={() => setPage(1)}          label="«" />
            <PageBtn disabled={safeP === 1}          onClick={() => setPage(p => Math.max(1, p-1))} label="‹ Prev" />
            <PageBtn disabled={safeP === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} label="Next ›" />
            <PageBtn disabled={safeP === totalPages} onClick={() => setPage(totalPages)} label="»" />
          </div>
        </div>
      </div>
    </div>
  );
}
