import { Sparkline } from '../components/charts/Sparkline';
import { Donut } from '../components/charts/Donut';
import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { ProgressBar } from '../components/charts/ProgressBar';
import { DeltaPill } from '../components/ui/DeltaPill';
import { Icon } from '../components/ui/Icon';
import { fmt$, fmtPct, fmtDate } from '../lib/format';
import {
  STATIC_KPI, STATIC_FLOW, STATIC_SPLIT, STATIC_BUDGET,
  STATIC_TRANSACTIONS, STATIC_GOALS,
} from '../lib/staticData';

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, delta, color, trendData, goodOnUp = true,
}: {
  label: string; value: string; delta: number;
  color: string; trendData: number[]; goodOnUp?: boolean;
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
        <Sparkline data={trendData} width={210} height={34} stroke={color} fill={color + '22'} />
      </div>
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────────────
export function Dashboard() {
  const flow = STATIC_FLOW;
  const kpi  = STATIC_KPI;

  const incomeTrend  = flow.map(f => f.income);
  const expenseTrend = flow.map(f => f.expenses);
  const savingsTrend = flow.map(f => f.income - f.expenses);
  const rateTrend    = flow.map(f => (f.income - f.expenses) / f.income * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total income"   value={fmt$(kpi.income.value)}      delta={kpi.income.delta}      color="#2FB37A" trendData={incomeTrend}  />
        <KpiCard label="Total expenses" value={fmt$(kpi.expenses.value)}    delta={kpi.expenses.delta}    color="#D8443F" trendData={expenseTrend} goodOnUp={false} />
        <KpiCard label="Net savings"    value={fmt$(kpi.savings.value)}     delta={kpi.savings.delta}     color="#7FB3E8" trendData={savingsTrend} />
        <KpiCard label="Savings rate"   value={fmtPct(kpi.savingsRate.value, 2)} delta={kpi.savingsRate.delta} color="#1F3F8A" trendData={rateTrend} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr 1.25fr', gap: 14 }}>

        {/* Money flow */}
        <div className="card" style={{ padding: '18px 22px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Money flow</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--brand)', display: 'inline-block' }} /> Income
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--expense-bar)', display: 'inline-block' }} /> Expense
                </span>
              </div>
            </div>
          </div>
          <MoneyFlowChart data={flow} />
        </div>

        {/* 50/30/20 */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>50 / 30 / 20</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>Needs · Wants · Savings</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 6px' }}>
            <Donut
              data={STATIC_SPLIT.map(s => ({ value: s.value, color: s.color, label: s.label }))}
              size={150} thickness={22}
              centerLabel="Of expenses"
              centerValue={fmtPct(STATIC_SPLIT[0].actual, 0)}
              bg="var(--bg)"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {STATIC_SPLIT.map(s => (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Budget</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>By category · April</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5, flex: 1, minWidth: 0 }}>
              {STATIC_BUDGET.slice(0, 6).map((b, i) => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                    background: i === 0 ? 'var(--ink)' : b.color, display: 'inline-block',
                  }} />
                  <span style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', width: 142, height: 142, flexShrink: 0 }}>
              <Donut
                data={STATIC_BUDGET.slice(0, 6).map(b => ({ value: b.spent, color: b.color, label: b.name }))}
                size={142} thickness={20}
                centerLabel="Total for month"
                centerValue={fmt$(kpi.expenses.value)}
                bg="var(--surface)"
              />
              <div style={{
                position: 'absolute', top: 2, right: -4,
                background: 'var(--bg)', borderRadius: 12, padding: '5px 10px',
                fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 600,
                boxShadow: '0 4px 10px rgba(15,14,26,0.06)',
                textAlign: 'center', lineHeight: 1.25,
                border: '1px solid var(--line)',
              }}>
                <div style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 12 }}>12%</div>
                <div style={{ fontSize: 10 }}>$1,195</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>

        {/* Recent transactions */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Recent transactions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>
              <Icon name="filter" size={13} /> Filter
            </div>
          </div>
          {STATIC_TRANSACTIONS.slice(0, 5).map((t, i) => (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '70px 1fr auto auto', alignItems: 'center',
              gap: 12, padding: '9px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtDate(t.date)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: t.amount > 0 ? 'var(--green-soft)' : 'var(--brand-soft)',
                  color: t.amount > 0 ? 'var(--green)' : 'var(--brand)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={t.amount > 0 ? 'arrowdown' : 'arrowup'} size={13} sw={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t.category?.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--bg)', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                {t.category?.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.amount > 0 ? 'var(--green)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
                {t.amount > 0 ? '+' : ''}{fmt$(t.amount, { cents: true })}
              </div>
            </div>
          ))}
        </div>

        {/* Savings goals */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Savings goals</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>On track · {STATIC_GOALS.length} active</div>
            </div>
            <button style={{
              width: 26, height: 26, borderRadius: 8, background: 'var(--bg)',
              display: 'grid', placeItems: 'center', color: 'var(--ink-soft)', cursor: 'pointer',
              border: 'none',
            }}>
              <Icon name="plus" size={13} sw={2.2} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {STATIC_GOALS.map(g => {
              const pct = (g.current / g.target) * 100;
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                      <b style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt$(g.current)}</b> / {fmt$(g.target)}
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={g.color} track="var(--bg)" height={6} />
                  <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {pct.toFixed(0)}% saved
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
