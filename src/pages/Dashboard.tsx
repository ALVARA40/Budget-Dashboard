import { useState } from 'react';
import { Sparkline } from '../components/charts/Sparkline';
import { Donut } from '../components/charts/Donut';
import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { ProgressBar } from '../components/charts/ProgressBar';
import { DeltaPill } from '../components/ui/DeltaPill';
import { Icon } from '../components/ui/Icon';
import { fmt$, fmtPct, fmtDate } from '../lib/format';
import { useDashboardData } from '../lib/useData';
import { useGoals } from '../lib/useGoals';
import type { CategoryBreakdownItem } from '../types/index';

// ── KPI Card with interactive sparkline ──────────────────────────────────────────────
function KpiCard({
  label, value, delta, color, trendData, trendLabels, goodOnUp = true, formatValue,
}: {
  label: string; value: string; delta: number;
  color: string; trendData: number[]; trendLabels?: string[];
  goodOnUp?: boolean; formatValue?: (v: number) => string;
}) {
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{label}</div>
        <DeltaPill value={delta} goodOnUp={goodOnUp} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ color, marginTop: -2 }}>
        <Sparkline
          data={trendData} labels={trendLabels}
          width={210} height={40}
          stroke={color} fill={color + '22'}
          formatValue={formatValue}
        />
      </div>
    </div>
  );
}

// ── Recent transactions with filter dropdown ───────────────────────────────────────────
function RecentTransactionsCard({ transactions }: { transactions: any[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  const filterMap: Record<string, (t: any) => boolean> = {
    'All':      () => true,
    'Income':   t => t.amount > 0,
    'Expenses': t => t.amount < 0,
  };
  const list = transactions.filter(filterMap[filter]).slice(0, 5);

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Recent transactions</div>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
              color: filter === 'All' ? 'var(--ink-soft)' : 'var(--brand)',
              background: (open || filter !== 'All') ? 'var(--brand-soft)' : 'transparent',
              border: '1px solid ' + ((open || filter !== 'All') ? 'var(--brand)' : 'transparent'),
            }}>
            <Icon name="filter" size={13} />
            {filter === 'All' ? 'Filter' : filter}
          </div>
          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 10,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 10, boxShadow: '0 14px 32px -10px rgba(15,14,26,0.18)',
                padding: 4, minWidth: 140,
              }}>
                {['All', 'Income', 'Expenses'].map(f => (
                  <div key={f} onClick={() => { setFilter(f); setOpen(false); }} style={{
                    padding: '7px 12px', fontSize: 12.5, borderRadius: 6, cursor: 'pointer',
                    color: filter === f ? 'var(--brand)' : 'var(--ink)',
                    fontWeight: filter === f ? 600 : 500,
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{f}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)' }}>
          No {filter.toLowerCase()} transactions this month.
        </div>
      ) : list.map((t, i) => (
        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto auto', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtDate(t.date)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: t.amount > 0 ? 'var(--green-soft)' : 'var(--brand-soft)', color: t.amount > 0 ? 'var(--green)' : 'var(--brand)', display: 'grid', placeItems: 'center' }}>
              <Icon name={t.amount > 0 ? 'arrowdown' : 'arrowup'} size={13} sw={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{(t.category as any)?.name}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--bg)', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{(t.category as any)?.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.amount > 0 ? 'var(--green)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
            {t.amount > 0 ? '+' : ''}{fmt$(t.amount, { cents: true })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Savings goals with add-goal form (real Supabase) ──────────────────────────────────
function SavingsGoalsCard() {
  const { goals, loading: goalsLoading, addGoal, deleteGoal } = useGoals();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', saved: '' });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!form.name || !form.target) return;
    setSubmitting(true);
    await addGoal(form.name, Number(form.target) || 0, Number(form.saved) || 0);
    setForm({ name: '', target: '', saved: '' });
    setAdding(false);
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: adding ? 12 : 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Savings goals</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>
            {goalsLoading ? 'Loading…' : `${goals.length} active`}
          </div>
        </div>
        <div
          onClick={() => setAdding(v => !v)}
          title="Add a savings goal"
          style={{
            width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer',
            background: adding ? 'var(--brand)' : 'var(--bg)',
            color: adding ? '#fff' : 'var(--ink-soft)',
            transition: 'background 0.15s',
          }}>
          <Icon name="plus" size={13} sw={2.2} />
        </div>
      </div>

      {adding && (
        <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--line)' }}>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Goal name (e.g. Down payment)"
            style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit', marginBottom: 6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            <input
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value.replace(/[^0-9.]/g, '') }))}
              placeholder="Target ($)"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <input
              value={form.saved}
              onChange={e => setForm(f => ({ ...f, saved: e.target.value.replace(/[^0-9.]/g, '') }))}
              placeholder="Saved so far ($)"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div onClick={submitting ? undefined : submit} style={{ flex: 1, background: submitting ? 'var(--ink-muted)' : 'var(--brand)', color: '#fff', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Saving…' : 'Add goal'}
            </div>
            <div onClick={() => { setAdding(false); setForm({ name: '', target: '', saved: '' }); }} style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-soft)', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</div>
          </div>
        </div>
      )}

      {goalsLoading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)' }}>Loading goals…</div>
      ) : goals.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)' }}>No goals yet — add one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map(g => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
            return (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{g.name}</div>
                    <div
                      onClick={() => deleteGoal(g.id)}
                      title="Remove goal"
                      style={{ fontSize: 11, color: 'var(--ink-muted)', cursor: 'pointer', lineHeight: 1, padding: '1px 4px', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                    >×</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                    <b style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt$(g.current)}</b> / {fmt$(g.target)}
                  </div>
                </div>
                <ProgressBar pct={pct} color={g.color} track="var(--bg)" height={6} />
                <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}% saved</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tracked vs Budget Chart with hover ───────────────────────────────────────────────
type TvbRow = { m: string; income: number; expenses: number; savings: number; budgetIncome?: number; budgetExpenses?: number; budgetSavings?: number };
function TrackedVsBudget({ data, currentMonth = 'Apr' }: { data: TvbRow[]; currentMonth?: string }) {
  const [hover, setHover] = useState<{ i: number; key: string } | null>(null);

  const seriesDef = [
    { key: 'income'   as const, label: 'Income',   dark: '#2FB37A', light: '#CFEADF' },
    { key: 'expenses' as const, label: 'Expenses', dark: '#D8443F', light: '#F5C9C7' },
    { key: 'savings'  as const, label: 'Savings',  dark: '#1F3F8A', light: '#CCD4E8' },
  ];
  const allValues: number[] = [];
  data.forEach(d => { seriesDef.forEach(s => { allValues.push(d[s.key]); }); });
  const niceMax = Math.ceil(Math.max(...allValues) / 10000) * 10000;
  const tickCount = 9;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));
  const plotH = 210;

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Tracked (vs. Budget)</div>
        <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: 'var(--ink)', fontWeight: 500, background: 'var(--bg)', borderRadius: 10, padding: '8px 14px', border: '1px solid var(--line)' }}>
          {seriesDef.map(s => (
            <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', width: 14, height: 10, borderRadius: 2, overflow: 'hidden' }}>
                <span style={{ flex: 1, background: s.dark }} /><span style={{ flex: 1, background: s.light }} />
              </span>{s.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 16 }}>
        <div style={{ width: 52, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: plotH, paddingRight: 8 }}>
          {ticks.map((t, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1, transform: 'translateY(50%)' }}>
              {i === 0 ? '' : t.toLocaleString('en-US')}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative', height: plotH }}>
          {ticks.map((_, i) => (<div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - i / tickCount) * 100}%`, height: 1, background: 'var(--line)', opacity: 0.7 }} />))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
            {data.map((d, i) => (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, position: 'relative' }}>
                {seriesDef.map(s => {
                  const trackedVal = d[s.key];
                  const isHover = hover?.i === i && hover?.key === s.key;
                  return (
                    <div
                      key={s.key}
                      onMouseEnter={() => setHover({ i, key: s.key })}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        width: 11, height: `${(trackedVal / niceMax) * 100}%`,
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        position: 'relative', cursor: 'pointer',
                        opacity: hover && !isHover ? 0.45 : 1,
                        transition: 'opacity 0.12s',
                      }}>
                      <div style={{ height: '100%', background: s.dark, borderRadius: '3px 3px 0 0' }} />
                      {isHover && (
                        <div style={{
                          position: 'absolute', bottom: '100%', left: '50%',
                          transform: 'translate(-50%, -8px)',
                          background: 'var(--ink)', color: '#fff',
                          padding: '7px 11px', borderRadius: 9,
                          fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                          boxShadow: '0 10px 22px -8px rgba(15,14,26,0.35)',
                          zIndex: 20, pointerEvents: 'none',
                        }}>
                          <div style={{ fontSize: 9.5, color: '#BFB6F5', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 3 }}>{d.m} · {s.label}</div>
                          <div style={{ display: 'flex', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                            <span>Tracked: <b>${trackedVal.toLocaleString()}</b></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {d.m === currentMonth && <div style={{ position: 'absolute', bottom: -6, left: 0, right: 0, height: 2, background: 'var(--ink)', borderRadius: 1 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 10, paddingLeft: 52 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: d.m === currentMonth ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: d.m === currentMonth ? 700 : 500 }}>{d.m}</div>
        ))}
      </div>
    </div>
  );
}

// ── Category Card ────────────────────────────────────────────────────────────────────────────
function CategoryCard({ title, accent, categories }: { title: string; accent: string; categories: CategoryBreakdownItem[] }) {
  const items = categories.filter(c => c.name !== 'Other');
  const other = categories.find(c => c.name === 'Other') || { value: 0, color: '#ECEAF4' };
  const total = categories.reduce((s, c) => s + c.value, 0);
  const donutData = categories.map(c => ({ value: Math.max(c.value, 0.0001), color: c.color, label: c.name }));
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>Categories (Tracked)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
        <div style={{ width: 150, height: 150, flexShrink: 0 }}>
          <Donut data={donutData} size={150} thickness={22}
            centerLabel={title}
            centerValue={'$' + total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {items.map(c => (
            <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', alignItems: 'center', gap: 10, padding: '4px 0', fontSize: 12.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block' }} />
              <span style={{ color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.value.toLocaleString('en-US')}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', alignItems: 'center', gap: 10, padding: '3px 0', fontSize: 12.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: other.color, display: 'inline-block' }} />
              <span style={{ color: 'var(--ink-soft)' }}>Other</span>
              <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{other.value.toLocaleString('en-US')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', alignItems: 'center', gap: 10, padding: '3px 0', fontSize: 13 }}>
              <span />
              <span style={{ color: 'var(--ink)', fontWeight: 700 }}>Total</span>
              <span style={{ color: 'var(--ink)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────────────────────
export function Dashboard({ year = 2026, month = 4 }: { year?: number; month?: number }) {
  const { kpi, flow, split, budget, transactions, incomeCategories, expenseCategories, savingsCategories, trackedVsBudget, loading } = useDashboardData(year, month);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const incomeTrend  = flow.map(f => f.income);
  const expenseTrend = flow.map(f => f.expenses);
  const savingsTrend = flow.map(f => f.income - f.expenses);
  const rateTrend    = flow.map(f => f.income > 0 ? (f.income - f.expenses) / f.income * 100 : 0);
  const flowLabels   = flow.map(f => f.m);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--ink-soft)', fontSize: 13 }}>
        Loading your data…
      </div>
    );
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total income"   value={fmt$(kpi.income.value)}           delta={kpi.income.delta}      color="#2FB37A" trendData={incomeTrend.length > 1 ? incomeTrend : [0,1]}  trendLabels={flowLabels} formatValue={v => fmt$(v)} />
        <KpiCard label="Total expenses" value={fmt$(kpi.expenses.value)}         delta={kpi.expenses.delta}    color="#D8443F" trendData={expenseTrend.length > 1 ? expenseTrend : [0,1]} trendLabels={flowLabels} formatValue={v => fmt$(v)} goodOnUp={false} />
        <KpiCard label="Net savings"    value={fmt$(kpi.savings.value)}          delta={kpi.savings.delta}     color="#7FB3E8" trendData={savingsTrend.length > 1 ? savingsTrend : [0,1]} trendLabels={flowLabels} formatValue={v => fmt$(v)} />
        <KpiCard label="Savings rate"   value={fmtPct(kpi.savingsRate.value, 2)} delta={kpi.savingsRate.delta} color="#1F3F8A" trendData={rateTrend.length > 1 ? rateTrend : [0,1]}       trendLabels={flowLabels} formatValue={v => v.toFixed(1) + '%'} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr 1.25fr', gap: 14 }}>
        <div className="card" style={{ padding: '18px 22px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Money flow</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--brand)', display: 'inline-block' }} /> Income</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--expense-bar)', display: 'inline-block' }} /> Expense</span>
            </div>
          </div>
          <MoneyFlowChart data={flow.length > 0 ? flow : [{m:'–', income:0, expenses:0}]} />
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>50 / 30 / 20</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>Needs · Wants · Savings</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 6px' }}>
            <Donut
              data={split.map(s => ({ value: s.value, color: s.color, label: s.label }))}
              size={150} thickness={22}
              centerLabel="Of expenses"
              centerValue={fmtPct(split[0]?.actual ?? 0, 0)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {split.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: 'var(--ink)', fontWeight: 500, flex: 1 }}>{s.label}</span>
                <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtPct(s.actual, 0)}</span>
                <span style={{ color: 'var(--ink-muted)', fontSize: 10.5 }}>target {s.target}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Budget</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>By category · top spending</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5, flex: 1, minWidth: 0 }}>
              {budget.slice(0, 6).map((b, i) => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: i === 0 ? 'var(--ink)' : b.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', width: 142, height: 142, flexShrink: 0 }}>
              <Donut
                data={budget.slice(0, 6).map(b => ({ value: b.spent, color: b.color, label: b.name }))}
                size={142} thickness={20}
                centerLabel="Total expenses"
                centerValue={fmt$(kpi.expenses.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
        <RecentTransactionsCard transactions={transactions} />
        <SavingsGoalsCard />
      </div>

      {/* Summary section — collapsible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Summary · {monthLabel}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>Tracked category breakdown vs. budget</div>
          </div>
          <div
            onClick={() => setSummaryOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
              borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)',
              fontSize: 12, color: 'var(--ink)', fontWeight: 500, cursor: 'pointer', userSelect: 'none',
            }}>
            {summaryOpen ? 'Hide details' : 'Show details'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: summaryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {summaryOpen && (
          <>
            <TrackedVsBudget
              data={trackedVsBudget.length > 0 ? trackedVsBudget : []}
              currentMonth={new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <CategoryCard title="Income"   accent="#2FB37A" categories={incomeCategories.length  > 0 ? incomeCategories  : [{ name: 'No data', value: 1, color: '#ECEAF4' }]} />
              <CategoryCard title="Expenses" accent="#D8443F" categories={expenseCategories.length > 0 ? expenseCategories : [{ name: 'No data', value: 1, color: '#ECEAF4' }]} />
              <CategoryCard title="Savings"  accent="#1F3F8A" categories={savingsCategories.length > 0 ? savingsCategories : [{ name: 'No data', value: 1, color: '#ECEAF4' }]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
