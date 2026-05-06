import { useState } from 'react';
import { Sparkline } from '../components/charts/Sparkline';
import { Donut } from '../components/charts/Donut';
import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { DeltaPill } from '../components/ui/DeltaPill';
import { fmt$, fmtPct } from '../lib/format';
import { useDashboardData } from '../lib/useData';
import type { GlobalFilters } from '../App';
import type { CategoryBreakdownItem } from '../types/index';

// ── KPI Card ─────────────────────────────────────────────────────────────────
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

// ── TrackedVsBudget ───────────────────────────────────────────────────────────
function TrackedVsBudget({
  data, currentMonth,
}: {
  data: { m: string; income: number; expenses: number; savings: number }[];
  currentMonth: string;
}) {
  const months = data.length > 0 ? data : [];
  const maxVal = Math.max(...months.flatMap(m => [m.income, m.expenses, m.savings]), 1);

  return (
    <div className="card" style={{ padding: '18px 22px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Tracked vs. Budget</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>Monthly income / expenses / savings</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2FB37A', display: 'inline-block' }} />
            {' '}Income
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#D8443F', display: 'inline-block' }} />
            {' '}Expenses
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#3B6BC8', display: 'inline-block' }} />
            {' '}Savings
          </span>
        </div>
      </div>
      {months.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13, padding: '20px 0' }}>No data for this period</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
          {months.map(m => (
            <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 90, width: '100%', justifyContent: 'center' }}>
                {[
                  { val: m.income,   color: '#2FB37A' },
                  { val: m.expenses, color: '#D8443F' },
                  { val: m.savings,  color: '#3B6BC8' },
                ].map((bar, i) => (
                  <div
                    key={i}
                    title={fmt$(bar.val)}
                    style={{
                      flex: 1,
                      height: `${Math.max(2, (bar.val / maxVal) * 90)}px`,
                      background: bar.color,
                      borderRadius: '3px 3px 0 0',
                      opacity: m.m === currentMonth ? 1 : 0.55,
                      transition: 'height 0.3s',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 10, color: m.m === currentMonth ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: m.m === currentMonth ? 700 : 400 }}>
                {m.m}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CategoryCard ──────────────────────────────────────────────────────────────
function CategoryCard({ title, accent, categories }: { title: string; accent: string; categories: CategoryBreakdownItem[] }) {
  const total = categories.reduce((s, c) => s + Math.abs(c.value), 0);
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{fmt$(total)}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          <Donut
            data={categories.map(c => ({ value: Math.abs(c.value), color: c.color, label: c.name }))}
            size={90} thickness={16}
            centerLabel="" centerValue=""
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {categories.slice(0, 5).map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ flex: 1, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt$(Math.abs(c.value))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export function Dashboard({ year = 2026, month = 4, refreshKey = 0, filters: _filters }: { year?: number; month?: number; refreshKey?: number; filters?: GlobalFilters }) {
  const { kpi, flow, split, budget, incomeCategories, expenseCategories, savingsCategories, trackedVsBudget, loading } = useDashboardData(year, month, refreshKey);
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

        {/* Money flow chart */}
        <div className="card" style={{ padding: '18px 22px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Money flow</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--brand)', display: 'inline-block' }} />
                {' '}Income
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--expense-bar)', display: 'inline-block' }} />
                {' '}Expense
              </span>
            </div>
          </div>
          <MoneyFlowChart data={flow.length > 0 ? flow : [{m:'–', income:0, expenses:0}]} />
        </div>

        {/* 50/30/20 donut */}
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

        {/* Budget donut */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Budget</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>By category · top spending</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5, flex: 1, minWidth: 0 }}>
              {budget.slice(0, 6).map((b) => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: b.color, display: 'inline-block' }} />
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
