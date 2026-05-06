import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fmt$ } from '../lib/format';
import { Icon } from '../components/ui/Icon';
import { Dropdown } from '../components/ui/Dropdown';
import type { Transaction } from '../types/index';
import type { GlobalFilters } from '../App';

function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BATCH = 1000;

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

export function BudgetTracking({ year = 0, month = 0, refreshKey = 0, filters }: { year?: number; month?: number; refreshKey?: number; filters?: GlobalFilters }) {
  const [rawTxns, setRawTxns]         = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterKind, setFilterKind]   = useState('All types');
  const [filterCat, setFilterCat]     = useState('All categories');
  const [filterBank, setFilterBank]   = useState('All banks');
  const [filterMonth, setFilterMonth] = useState('All months');
  const [sortKey, setSortKey]         = useState('date');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');
  const [page, setPage]               = useState(1);
  const [perPage, setPerPage]         = useState(50);
  const [dense, setDense]             = useState(false);

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
      if (!cancelled) { setRawTxns(all as Transaction[]); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month, refreshKey]);

  useEffect(() => { setPage(1); }, [search, filterKind, filterCat, filterBank, filterMonth, perPage]);

  // Apply global filters reactively via useMemo — no re-fetch needed
  const allTxns = useMemo(() => rawTxns.filter(t => {
    if (filters?.category && filters.category !== 'All' && (t.category as any)?.name !== filters.category) return false;
    if (filters?.bank     && filters.bank     !== 'All' && (t.bank as any)?.name     !== filters.bank)     return false;
    if (filters?.company  && filters.company  !== 'All' && (t.company as any)?.name  !== filters.company)  return false;
    if (filters?.search   && filters.search !== '') {
      const q = filters.search.toLowerCase();
      if (!t.description?.toLowerCase().includes(q) &&
          !(t.category as any)?.name?.toLowerCase().includes(q) &&
          !(t.bank as any)?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rawTxns, filters]);

  const allCats  = useMemo(() => Array.from(new Set(allTxns.map(t => (t.category as {name?:string}|null)?.name ?? '').filter(Boolean))).sort(), [allTxns]);
  const allBanks = useMemo(() => Array.from(new Set(allTxns.map(t => (t.bank as {name?:string}|null)?.name ?? '').filter(Boolean))).sort(), [allTxns]);

  const { allMonths, monthLabelToYM } = useMemo(() => {
    const ymSet = new Set<string>();
    allTxns.forEach(t => { if (t.date) ymSet.add(t.date.slice(0, 7)); });
    const sorted = Array.from(ymSet).sort().reverse();
    const lookup: Record<string, string> = {};
    sorted.forEach(ym => {
      const [y2, m2] = ym.split('-').map(Number);
      const label = new Date(y2, m2 - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      lookup[label] = ym;
    });
    return { allMonths: sorted, monthLabelToYM: lookup };
  }, [allTxns]);

  const monthOptions = useMemo(() => [
    'All months',
    ...allMonths.map(ym => {
      const [y2, m2] = ym.split('-').map(Number);
      return new Date(y2, m2 - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }),
  ], [allMonths]);

  const hasFilter = search || filterKind !== 'All types' || filterCat !== 'All categories' || filterBank !== 'All banks' || filterMonth !== 'All months';
  const clearAll = () => { setSearch(''); setFilterKind('All types'); setFilterCat('All categories'); setFilterBank('All banks'); setFilterMonth('All months'); };

  const filtered = useMemo(() => {
    let out = allTxns.filter(t => {
      const kind     = (t.category as {kind?:string}|null)?.kind ?? '';
      const catName  = (t.category as {name?:string}|null)?.name ?? '';
      const bankName = (t.bank    as {name?:string}|null)?.name ?? '';

      if (filterKind === 'Income'   && kind !== 'income')  return false;
      if (filterKind === 'Expenses' && (kind === 'income' || kind === 'savings')) return false;
      if (filterKind === 'Savings'  && kind !== 'savings') return false;
      if (filterCat  !== 'All categories' && catName !== filterCat)  return false;
      if (filterBank !== 'All banks'      && bankName !== filterBank) return false;
      if (filterMonth !== 'All months') {
        const ym = monthLabelToYM[filterMonth];
        if (ym && !t.date.startsWith(ym)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const desc = (t.description ?? '').toLowerCase();
        const comp = ((t.company as {name?:string}|null)?.name ?? '').toLowerCase();
        if (!desc.includes(q) && !catName.toLowerCase().includes(q) && !bankName.toLowerCase().includes(q) && !comp.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      if (sortKey === 'date')   return (a.date > b.date ? 1 : -1) * dir;
      if (sortKey === 'amount') return (a.amount - b.amount) * dir;
      if (sortKey === 'cat')    return (((a.category as {name?:string}|null)?.name ?? '') > ((b.category as {name?:string}|null)?.name ?? '') ? 1 : -1) * dir;
      if (sortKey === 'bank')   return (((a.bank as {name?:string}|null)?.name ?? '') > ((b.bank as {name?:string}|null)?.name ?? '') ? 1 : -1) * dir;
      if (sortKey === 'desc')   return ((a.description ?? '') > (b.description ?? '') ? 1 : -1) * dir;
      if (sortKey === 'comp')   return (((a.company as {name?:string}|null)?.name ?? '') > ((b.company as {name?:string}|null)?.name ?? '') ? 1 : -1) * dir;
      return 0;
    });
    return out;
  }, [allTxns, search, filterKind, filterCat, filterBank, filterMonth, monthLabelToYM, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safeP      = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safeP - 1) * perPage, safeP * perPage);
  const startIdx   = filtered.length === 0 ? 0 : (safeP - 1) * perPage + 1;
  const endIdx     = Math.min(safeP * perPage, filtered.length);

  const totalIncome   = filtered.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.amount < 0 && (t.category as {kind?:string}|null)?.kind !== 'savings').reduce((s,t) => s + Math.abs(t.amount), 0);
  const totalSavings  = filtered.filter(t => (t.category as {kind?:string}|null)?.kind === 'savings').reduce((s,t) => s + Math.abs(t.amount), 0);

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(k === 'date' || k === 'amount' ? 'desc' : 'asc'); }
  };

  const exportCSV = () => {
    const hdr = ['Date','Description','Category','Bank','Company','Type','Amount'];
    const rows = filtered.map(t => {
      const kind = (t.category as {kind?:string}|null)?.kind ?? '';
      return [
        t.date,
        t.description,
        (t.category as {name?:string}|null)?.name ?? '',
        (t.bank     as {name?:string}|null)?.name ?? '',
        (t.company  as {name?:string}|null)?.name ?? '',
        kind === 'income' ? 'Income' : kind === 'savings' ? 'Savings' : 'Expense',
        t.amount.toFixed(2),
      ];
    });
    const csv = [hdr, ...rows].map(r => r.map(x => '"' + String(x).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const catColor = (kind: string) =>
    kind === 'income' ? 'var(--green)' : kind === 'savings' ? '#4BA3F7' : 'var(--brand)';

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 10px',
    fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.05em',
    borderBottom: '1px solid var(--line)', background: 'var(--surface)',
    whiteSpace: 'nowrap',
  };
  const tdP = dense ? '6px 10px' : '11px 10px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiMini label="Transactions" value={filtered.length.toLocaleString()} sub={hasFilter ? 'of ' + allTxns.length.toLocaleString() + ' total' : 'All months'} color="var(--brand)" />
        <KpiMini label="Income"       value={fmt$(totalIncome)}   sub={filtered.filter(t=>t.amount>0).length + ' transactions'} color="var(--green)" />
        <KpiMini label="Expenses"     value={fmt$(totalExpenses)} sub={filtered.filter(t=>t.amount<0 && (t.category as {kind?:string}|null)?.kind !== 'savings').length + ' transactions'} color="var(--red)" />
        <KpiMini label="Savings"      value={fmt$(totalSavings)}  sub={filtered.filter(t=>(t.category as {kind?:string}|null)?.kind==='savings').length + ' transactions'} color="#4BA3F7" />
      </div>

      {/* Filter toolbar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 999, padding: '7px 14px', minWidth: 260,
          }}>
            <Icon name="search" size={13} stroke="var(--ink-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by merchant, category, bank…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', flex: 1, fontFamily: 'inherit' }} />
            {search && <span onClick={() => setSearch('')} style={{ color: 'var(--ink-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</span>}
          </div>

          <Dropdown label="Category" value={filterCat}   options={['All categories', ...allCats]}        onChange={setFilterCat} />
          <Dropdown label="Bank"     value={filterBank}  options={['All banks', ...allBanks]}            onChange={setFilterBank} />
          <Dropdown label="Type"     value={filterKind}  options={['All types','Income','Expenses','Savings']} onChange={setFilterKind} />
          <Dropdown label="Month"    value={filterMonth} options={monthOptions}                          onChange={setFilterMonth} />

          {hasFilter && (
            <div onClick={clearAll} style={{ color: 'var(--brand)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: '7px 10px' }}>
              Clear filters
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div onClick={() => setDense(v => !v)} style={{
            background: dense ? 'var(--brand-soft)' : 'var(--surface)',
            color: dense ? 'var(--brand)' : 'var(--ink)',
            border: '1px solid ' + (dense ? 'var(--brand)' : 'var(--line)'),
            padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>{dense ? 'Comfortable' : 'Compact'}</div>

          <div onClick={exportCSV} style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            color: 'var(--ink)', padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', maxHeight: '62vh' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface)' }}>
                <th style={{ ...thStyle, width: 120 }}><SortHeader label="DATE"        sortKey="date"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={thStyle}                   ><SortHeader label="DESCRIPTION" sortKey="desc"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={{ ...thStyle, width: 170 }}><SortHeader label="CATEGORY"   sortKey="cat"    currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={{ ...thStyle, width: 150 }}><SortHeader label="BANK"       sortKey="bank"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={{ ...thStyle, width: 150 }}><SortHeader label="COMPANY"    sortKey="comp"   currentKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                <th style={{ ...thStyle, width: 100 }}>TYPE</th>
                <th style={{ ...thStyle, width: 130, textAlign: 'right' }}><SortHeader label="AMOUNT" sortKey="amount" currentKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" /></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading transactions…</td></tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  No transactions match these filters.{' '}
                  {hasFilter && <span onClick={clearAll} style={{ color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>Clear filters</span>}
                </td></tr>
              )}
              {!loading && pageRows.map((t, i) => {
                const kind     = (t.category as {kind?:string}|null)?.kind ?? '';
                const catName  = (t.category as {name?:string}|null)?.name ?? '–';
                const bankName = (t.bank     as {name?:string}|null)?.name ?? '–';
                const compName = (t.company  as {name?:string}|null)?.name ?? '–';
                const cc = catColor(kind);
                const typeLabel = kind === 'income' ? 'Income' : kind === 'savings' ? 'Savings' : 'Expense';
                const typeDot   = kind === 'income' ? 'var(--green)' : kind === 'savings' ? '#4BA3F7' : 'var(--red)';
                return (
                  <tr key={t.id} style={{ background: i % 2 ? 'var(--bg)' : 'var(--surface)' }}>
                    <td style={{ padding: tdP, color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{fmtDateShort(t.date)}</td>
                    <td style={{ padding: tdP, fontWeight: 600, borderBottom: '1px solid var(--line)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{t.description}</td>
                    <td style={{ padding: tdP, borderBottom: '1px solid var(--line)' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: cc + '20', color: cc, fontWeight: 600 }}>{catName}</span>
                    </td>
                    <td style={{ padding: tdP, color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{bankName}</td>
                    <td style={{ padding: tdP, color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{compName}</td>
                    <td style={{ padding: tdP, borderBottom: '1px solid var(--line)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontSize: 11.5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: typeDot, display: 'inline-block' }} />
                        {typeLabel}
                      </span>
                    </td>
                    <td style={{ padding: tdP, textAlign: 'right', fontWeight: 700, borderBottom: '1px solid var(--line)', color: t.amount > 0 ? 'var(--green)' : kind === 'savings' ? '#4BA3F7' : 'var(--ink)' }}>
                      {t.amount > 0 ? '+' : '–'}{fmt$(Math.abs(t.amount), { cents: true })}
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
          padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
            {loading ? 'Loading…' : (<>
              Showing <b style={{ color: 'var(--ink)' }}>{startIdx.toLocaleString()}–{endIdx.toLocaleString()}</b> of <b style={{ color: 'var(--ink)' }}>{filtered.length.toLocaleString()}</b> transactions
              {hasFilter && <> · filtered from {allTxns.length.toLocaleString()} total</>}
            </>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Rows per page:</span>
            <Dropdown value={String(perPage)} options={['25','50','100','200']} onChange={v => { setPerPage(Number(v)); setPage(1); }} />
            <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
            <PageBtn disabled={safeP === 1}          onClick={() => setPage(1)}          label="«" />
            <PageBtn disabled={safeP === 1}          onClick={() => setPage(p => Math.max(1, p-1))} label="‹ Prev" />
            <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600, padding: '0 4px' }}>Page {safeP} of {totalPages}</div>
            <PageBtn disabled={safeP === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} label="Next ›" />
            <PageBtn disabled={safeP === totalPages} onClick={() => setPage(totalPages)} label="»" />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', padding: '0 4px' }}>
        <b style={{ color: 'var(--ink)' }}>Tip:</b> Click any column header to sort · Use filters to narrow down · Export the current filtered view as CSV · Compact mode fits more rows on screen.
      </div>
    </div>
  );
}
