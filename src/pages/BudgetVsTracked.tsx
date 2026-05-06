import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useBudgetPlan } from '../lib/useBudgetPlan';
import { fmt$ } from '../lib/format';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SORT_OPTIONS = ['Sheet order', 'Name A–Z', 'Amount spent', '% of budget'];

interface CatRow {
  id: string;
  name: string;
  kind: 'income' | 'need' | 'want' | 'savings';
  order: number;
}

interface TxnAgg {
  categoryId: string;
  spent: number; // absolute value
}

type SortOption = typeof SORT_OPTIONS[number];

function PctPill({ pct, empty }: { pct: number; empty: boolean }) {
  if (empty) return <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>–</span>;
  const over = pct > 100;
  const bg   = over ? '#FDDCDC' : '#D5F5E3';
  const fg   = over ? '#C0392B' : '#1E8449';
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
      background: bg, color: fg, whiteSpace: 'nowrap',
    }}>
      {Math.round(pct)}%
    </span>
  );
}

function ProgressBar({ pct, kind }: { pct: number; kind: string }) {
  const fill = kind === 'income' ? '#2FB37A' : kind === 'savings' ? '#3B6BC8' : '#D8443F';
  const track = kind === 'income' ? '#D5F5E3' : kind === 'savings' ? '#DDEAF9' : '#FDDCDC';
  const capped = Math.min(pct, 100);
  return (
    <div style={{ height: 4, borderRadius: 999, background: track, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${capped}%`, borderRadius: 999, background: fill, transition: 'width 0.3s' }} />
    </div>
  );
}

function ColHeader({
  label, total, budget, kind, count,
}: {
  label: string; total: number; budget: number; kind: string; count: number;
}) {
  const pct    = budget > 0 ? (total / budget) * 100 : 0;
  const accent = kind === 'income' ? '#1B6B3A' : kind === 'savings' ? '#1F3F8A' : '#922B21';
  const bg     = kind === 'income' ? '#EBF9F2' : kind === 'savings' ? '#EAF0FB' : '#FDEDEC';
  const border = kind === 'income' ? '#A9DFBF' : kind === 'savings' ? '#AACBEE' : '#F5B7B1';

  return (
    <div style={{ background: bg, borderBottom: `2px solid ${border}`, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.07em' }}>
          {label.toUpperCase()}
        </span>
        <span style={{
          background: 'white', border: `1px solid ${border}`,
          borderRadius: 999, fontSize: 11, fontWeight: 600, color: accent,
          padding: '2px 8px',
        }}>{count}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {fmt$(total)}
      </div>
      <div style={{ fontSize: 11.5, color: accent, opacity: 0.75, marginTop: 2 }}>
        of {fmt$(budget)} budget · {budget > 0 ? Math.round(pct) : 0}%
      </div>
      <ProgressBar pct={pct} kind={kind} />
    </div>
  );
}

function CatRowItem({
  name, spent, budget, kind, hideEmpty,
}: {
  name: string; spent: number; budget: number; kind: string; hideEmpty: boolean;
}) {
  const isEmpty = spent === 0 && budget === 0;
  if (hideEmpty && isEmpty) return null;

  const pct       = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
  const hasBudget = budget > 0;

  if (isEmpty) {
    return (
      <div style={{
        padding: '8px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', fontWeight: 400 }}>{name}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>–</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <PctPill pct={pct} empty={false} />
      </div>
      <ProgressBar pct={pct} kind={kind} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5, fontSize: 11.5, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt$(spent)} / {hasBudget ? fmt$(budget) : '–'}
      </div>
    </div>
  );
}

export function BudgetVsTracked({ year = 2026, month = 4, refreshKey = 0 }: { year?: number; month?: number; refreshKey?: number }) {
  const [cats, setCats]         = useState<CatRow[]>([]);
  const [aggs, setAggs]         = useState<TxnAgg[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selMonth, setSelMonth] = useState(month);
  const [selYear, setSelYear]   = useState(year);
  const [sort, setSort]         = useState<SortOption>('Amount spent');
  const [hideEmpty, setHideEmpty] = useState(false);

  // Sync when parent changes
  useEffect(() => { setSelMonth(month); }, [month]);
  useEffect(() => { setSelYear(year); }, [year]);

  const { plan, loading: planLoading } = useBudgetPlan(selYear);

  // Load categories and aggregate transactions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      // Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, kind')
        .eq('user_id', uid)
        .order('name');

      // Transactions for selected month
      const from = `${selYear}-${String(selMonth).padStart(2,'0')}-01`;
      const to   = new Date(selYear, selMonth, 0).toISOString().slice(0,10);
      const { data: txnData } = await supabase
        .from('transactions')
        .select('amount, category_id, category:categories(kind)')
        .eq('user_id', uid)
        .gte('date', from)
        .lte('date', to);

      if (cancelled) return;

      // Map categories with a stable order index
      const catList: CatRow[] = (catData || []).map((c: any, i: number) => ({
        id: c.id, name: c.name, kind: c.kind, order: i,
      }));
      setCats(catList);

      // Aggregate by category_id
      const aggMap: Record<string, number> = {};
      (txnData || []).forEach((t: any) => {
        if (!t.category_id) return;
        aggMap[t.category_id] = (aggMap[t.category_id] ?? 0) + Math.abs(t.amount);
      });
      setAggs(Object.entries(aggMap).map(([categoryId, spent]) => ({ categoryId, spent })));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selYear, selMonth, refreshKey]);

  // Build per-category rows with budget + spent
  const rows = useMemo(() => {
    return cats.map(c => {
      const spent  = aggs.find(a => a.categoryId === c.id)?.spent ?? 0;
      const budget = plan[c.name]?.[selMonth] ?? 0;
      return { ...c, spent, budget };
    });
  }, [cats, aggs, plan, selMonth]);

  // Group and filter
  const incomeRows  = useMemo(() => rows.filter(r => r.kind === 'income'),  [rows]);
  const expenseRows = useMemo(() => rows.filter(r => r.kind === 'need' || r.kind === 'want'), [rows]);
  const savingsRows = useMemo(() => rows.filter(r => r.kind === 'savings'), [rows]);

  function applySort(list: typeof rows) {
    const q = search.toLowerCase();
    let out = q ? list.filter(r => r.name.toLowerCase().includes(q)) : list;
    if (sort === 'Name A–Z')      out = [...out].sort((a,b) => a.name.localeCompare(b.name));
    if (sort === 'Amount spent')  out = [...out].sort((a,b) => b.spent - a.spent);
    if (sort === '% of budget')   out = [...out].sort((a,b) => {
      const pa = a.budget > 0 ? a.spent / a.budget : 0;
      const pb = b.budget > 0 ? b.spent / b.budget : 0;
      return pb - pa;
    });
    return out;
  }

  const sortedIncome  = applySort(incomeRows);
  const sortedExpense = applySort(expenseRows);
  const sortedSavings = applySort(savingsRows);

  // Summary totals
  const totalIncome   = incomeRows.reduce((s,r)  => s + r.spent, 0);
  const budgetIncome  = incomeRows.reduce((s,r)  => s + r.budget, 0);
  const totalExpense  = expenseRows.reduce((s,r) => s + r.spent, 0);
  const budgetExpense = expenseRows.reduce((s,r) => s + r.budget, 0);
  const totalSavings  = savingsRows.reduce((s,r) => s + r.spent, 0);
  const budgetSavings = savingsRows.reduce((s,r) => s + r.budget, 0);

  const isLoading = loading || planLoading;
  const monthLabel = MONTH_NAMES[selMonth - 1] + ' ' + selYear;

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Page title */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Budget vs Tracked</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
          Preview · the full page will share the Dashboard's visual system
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        marginBottom: 18,
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 999, padding: '7px 14px', minWidth: 220,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search categories…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', flex: 1, fontFamily: 'inherit' }}
          />
          {search && <span onClick={() => setSearch('')} style={{ color: 'var(--ink-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</span>}
        </div>

        {/* Month picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '7px 14px' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontWeight: 500 }}>Month</span>
          <select
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m} {selYear}</option>
            ))}
          </select>
        </div>

        {/* Year picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '7px 14px' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontWeight: 500 }}>Year</span>
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Sort picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '7px 14px' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontWeight: 500 }}>Sort</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Hide empty toggle */}
        <button
          onClick={() => setHideEmpty(v => !v)}
          style={{
            marginLeft: 'auto',
            background: hideEmpty ? 'var(--brand)' : 'var(--surface)',
            color: hideEmpty ? '#fff' : 'var(--ink)',
            border: '1px solid ' + (hideEmpty ? 'var(--brand)' : 'var(--line)'),
            borderRadius: 999, padding: '7px 16px', fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {hideEmpty ? 'Show all rows' : 'Hide empty rows'}
        </button>
      </div>

      {/* Summary bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '16px 24px', marginBottom: 18,
        display: 'flex', alignItems: 'flex-start', gap: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            {monthLabel} summary
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Tracked vs budget across all categories</div>
        </div>
        {[
          { label: 'INCOME',   total: totalIncome,   budget: budgetIncome,   color: '#1B6B3A' },
          { label: 'EXPENSES', total: totalExpense,  budget: budgetExpense,  color: '#922B21' },
          { label: 'SAVINGS',  total: totalSavings,  budget: budgetSavings,  color: '#1F3F8A' },
        ].map(s => {
          const pct = s.budget > 0 ? Math.round((s.total / s.budget) * 100) : 0;
          const over = pct > 100;
          return (
            <div key={s.label} style={{ textAlign: 'right', paddingLeft: 32 }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt$(s.total)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                of {fmt$(s.budget)} ·{' '}
                <span style={{ color: over ? '#C0392B' : '#1E8449', fontWeight: 700 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-column grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
          {/* INCOME */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <ColHeader label="Income" total={totalIncome} budget={budgetIncome} kind="income" count={sortedIncome.filter(r => !hideEmpty || r.spent > 0 || r.budget > 0).length} />
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {sortedIncome.map(r => (
                <CatRowItem key={r.id} name={r.name} spent={r.spent} budget={r.budget} kind="income" hideEmpty={hideEmpty} />
              ))}
              {sortedIncome.length === 0 && (
                <div style={{ padding: '24px 20px', color: 'var(--ink-muted)', fontSize: 12.5 }}>No income categories</div>
              )}
            </div>
          </div>

          {/* EXPENSES */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <ColHeader label="Expenses" total={totalExpense} budget={budgetExpense} kind="expenses" count={sortedExpense.filter(r => !hideEmpty || r.spent > 0 || r.budget > 0).length} />
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {sortedExpense.map(r => (
                <CatRowItem key={r.id} name={r.name} spent={r.spent} budget={r.budget} kind="expense" hideEmpty={hideEmpty} />
              ))}
              {sortedExpense.length === 0 && (
                <div style={{ padding: '24px 20px', color: 'var(--ink-muted)', fontSize: 12.5 }}>No expense categories</div>
              )}
            </div>
          </div>

          {/* SAVINGS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <ColHeader label="Savings" total={totalSavings} budget={budgetSavings} kind="savings" count={sortedSavings.filter(r => !hideEmpty || r.spent > 0 || r.budget > 0).length} />
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {sortedSavings.map(r => (
                <CatRowItem key={r.id} name={r.name} spent={r.spent} budget={r.budget} kind="savings" hideEmpty={hideEmpty} />
              ))}
              {sortedSavings.length === 0 && (
                <div style={{ padding: '24px 20px', color: 'var(--ink-muted)', fontSize: 12.5 }}>No savings categories</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
