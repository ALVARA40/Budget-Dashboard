import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fmt$ } from '../lib/format';
import { Icon } from '../components/ui/Icon';
import type { Transaction } from '../types/index';

const KIND_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  need:    { label: 'Need',    bg: '#EFEBFF', color: '#7C5CFC' },
  want:    { label: 'Want',    bg: '#FBF1D8', color: '#E6A214' },
  savings: { label: 'Savings', bg: '#E3F5EC', color: '#1F9D6E' },
  income:  { label: 'Income',  bg: '#E3F5EC', color: '#1F9D6E' },
};

function KindBadge({ kind }: { kind: string }) {
  const cfg = KIND_CONFIG[kind] ?? { label: kind, bg: '#F5F4FB', color: '#6B6780' };
  return (
    <span style={{ display:'inline-block', padding:'3px 9px', borderRadius:999, background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtYear(iso: string) {
  return new Date(iso + 'T12:00:00').getFullYear().toString();
}

const GRID = '72px 52px 1fr 90px 130px 150px 1fr 110px 56px';
const PAGE_SIZE = 100;

export function BudgetTracking({ year = 0, month = 0 }: { year?: number; month?: number }) {
  const [allTxns, setAllTxns]       = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const [filterCat, setFilterCat]   = useState('all');
  const [page, setPage]             = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), bank:banks(*), company:companies(*)')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      // Filter by year/month if provided
      if (year > 0 && month > 0) {
        const from = `${year}-${String(month).padStart(2,'0')}-01`;
        const to   = new Date(year, month, 0).toISOString().slice(0,10);
        query = query.gte('date', from).lte('date', to);
      }

      const { data } = await query;
      if (!cancelled) {
        setAllTxns((data as Transaction[]) || []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, filterKind, filterCat]);

  const allCats = Array.from(new Set(allTxns.map(t => t.category?.name ?? '').filter(Boolean))).sort();

  const filtered = allTxns.filter(t => {
    const kind = t.category?.kind ?? '';
    const matchKind =
      filterKind === 'all' ? true :
      filterKind === 'income'  ? kind === 'income' :
      filterKind === 'expense' ? (kind !== 'income' && kind !== 'savings') :
      filterKind === 'savings' ? kind === 'savings' : true;
    const matchCat = filterCat === 'all' || (t.category?.name ?? '') === filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.description.toLowerCase().includes(q) ||
      (t.category?.name ?? '').toLowerCase().includes(q) ||
      (t.bank?.name ?? '').toLowerCase().includes(q) ||
      (t.company?.name ?? '').toLowerCase().includes(q);
    return matchKind && matchCat && matchSearch;
  });

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalIncome   = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const totalNet      = totalIncome + totalExpenses;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.02em' }}>Budget Tracking</div>
          <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:3 }}>
            {loading ? 'Loading…' : `${filtered.length} of ${allTxns.length} transactions`}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <Icon name="search" size={14} stroke="var(--ink-muted)" />
            </span>
            <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, width:180 }} />
          </div>
          <select className="input" value={filterKind} onChange={e => setFilterKind(e.target.value)} style={{ width:130 }}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
            <option value="savings">Savings</option>
          </select>
          <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width:160 }}>
            <option value="all">All categories</option>
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#E3F5EC', borderRadius:10, padding:'8px 14px' }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'#1F9D6E' }}>Income</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#1F9D6E', fontVariantNumeric:'tabular-nums' }}>+{fmt$(totalIncome, { cents:true })}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FDEAE9', borderRadius:10, padding:'8px 14px' }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'#D8443F' }}>Expenses</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#D8443F', fontVariantNumeric:'tabular-nums' }}>{fmt$(totalExpenses, { cents:true })}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EFEBFF', borderRadius:10, padding:'8px 14px' }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'#7C5CFC' }}>Net</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#7C5CFC', fontVariantNumeric:'tabular-nums' }}>{totalNet >= 0 ? '+' : ''}{fmt$(totalNet, { cents:true })}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:GRID, gap:10, padding:'10px 18px', borderBottom:'1px solid var(--line)', fontSize:10.5, fontWeight:700, color:'var(--ink-muted)', letterSpacing:'0.06em', textTransform:'uppercase' as const }}>
          <div>Date</div><div>Year</div><div>Category</div><div>50/30/20</div><div>Bank</div><div>Company</div><div>Description</div><div style={{ textAlign:'right' }}>Amount</div><div></div>
        </div>

        {loading && (
          <div style={{ padding:'48px 20px', textAlign:'center', color:'var(--ink-muted)', fontSize:13 }}>Loading transactions…</div>
        )}

        {!loading && paginated.map((t, i) => (
          <div key={t.id} style={{ display:'grid', gridTemplateColumns:GRID, gap:10, padding:'11px 18px', alignItems:'center', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', fontVariantNumeric:'tabular-nums' }}>{fmtDateShort(t.date)}</div>
            <div style={{ fontSize:11.5, color:'var(--ink-muted)', fontVariantNumeric:'tabular-nums' }}>{fmtYear(t.date)}</div>
            <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
              <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, background: t.amount > 0 ? 'var(--green-soft)' : 'var(--brand-soft)', color: t.amount > 0 ? 'var(--green)' : 'var(--brand)', display:'grid', placeItems:'center' }}>
                <Icon name={t.amount > 0 ? 'arrowdown' : 'arrowup'} size={12} sw={2.2} />
              </div>
              <span style={{ fontSize:12.5, color:'var(--ink)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.category?.name ?? '-'}</span>
            </div>
            <div><KindBadge kind={t.category?.kind ?? 'want'} /></div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.bank?.name ?? '-'}</div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.company?.name ?? '-'}</div>
            <div style={{ fontSize:12.5, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
            <div style={{ fontSize:13, fontWeight:700, fontVariantNumeric:'tabular-nums', color: t.amount > 0 ? 'var(--green)' : 'var(--ink)', textAlign:'right' }}>{t.amount > 0 ? '+' : ''}{fmt$(t.amount, { cents:true })}</div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:2 }}>
              <button title="Edit" style={{ color:'var(--ink-muted)', cursor:'pointer', padding:4, background:'none', border:'none' }}><Icon name="edit" size={13} /></button>
              <button title="Delete" style={{ color:'var(--red)', cursor:'pointer', padding:4, background:'none', border:'none' }}><Icon name="trash" size={13} /></button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ padding:'48px 20px', textAlign:'center', color:'var(--ink-muted)', fontSize:13 }}>No transactions match your filters.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
            style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--line)', background:'var(--surface)', color:'var(--ink)', fontSize:12.5, fontWeight:600, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontFamily:'inherit' }}>
            ← Previous
          </button>
          <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>Page {page+1} of {totalPages} · {filtered.length} transactions</span>
          <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1}
            style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--line)', background:'var(--surface)', color:'var(--ink)', fontSize:12.5, fontWeight:600, cursor: page === totalPages-1 ? 'not-allowed' : 'pointer', opacity: page === totalPages-1 ? 0.4 : 1, fontFamily:'inherit' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
