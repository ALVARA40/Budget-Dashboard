import { Donut } from '../components/charts/Donut';
import { ProgressBar } from '../components/charts/ProgressBar';
import { STATIC_SPLIT } from '../lib/staticData';
import { fmt$, fmtPct } from '../lib/format';

const CATEGORIES_BY_KIND = [
  { kind: 'need',    label: 'Needs',   color: '#7C5CFC', target: 50, items: [
    { name: 'Mortgage/Rent',        amount: 4433.48 },
    { name: 'Federal Tax',          amount: 2666.80 },
    { name: 'Social Security/FICA', amount: 1029.12 },
    { name: 'Health Insurance',     amount: 735.10  },
    { name: 'Groceries',            amount: 1194.56 },
    { name: 'Fuel',                 amount: 62.40   },
    { name: 'Car Purchase',         amount: 495.78  },
    { name: 'Cell Phone',           amount: 75.00   },
    { name: 'Internet',             amount: 55.00   },
    { name: 'Electricity',          amount: 110.00  },
  ]},
  { kind: 'want',    label: 'Wants',   color: '#F5B544', target: 30, items: [
    { name: 'Dining out',           amount: 487.00  },
    { name: 'Shopping',             amount: 612.00  },
    { name: 'Entertainment',        amount: 180.00  },
    { name: 'Streaming services',   amount: 22.99   },
    { name: 'Amazon',               amount: 214.88  },
    { name: 'Netflix',              amount: 22.99   },
    { name: 'Gym Membership',       amount: 55.00   },
  ]},
  { kind: 'savings', label: 'Savings', color: '#33C58A', target: 20, items: [
    { name: '401k',                 amount: 2000.00 },
    { name: 'Emergency Fund',       amount: 1000.00 },
    { name: 'Roth IRA',             amount: 500.00  },
    { name: 'Investment Account',   amount: 693.20  },
  ]},
];

export function Split5030() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>50 / 30 / 20</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>Needs · Wants · Savings · April 2026</div>
      </div>

      {/* Overview row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>
        <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Donut
            data={STATIC_SPLIT.map(s => ({ value: s.value, color: s.color }))}
            size={180} thickness={28}
            centerLabel="Of expenses"
            centerValue={fmtPct(STATIC_SPLIT[0].actual, 0)}
            bg="var(--bg)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {STATIC_SPLIT.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</span>
                <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--ink)' }}>{fmtPct(s.actual, 0)}</span>
                <span style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 999,
                  background: Math.abs(s.actual - s.target) < 3 ? 'var(--green-soft)' : 'rgba(242,95,92,0.1)',
                  color: Math.abs(s.actual - s.target) < 3 ? 'var(--green)' : 'var(--red)',
                  fontWeight: 600,
                }}>target {s.target}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CATEGORIES_BY_KIND.map(section => {
            const total = section.items.reduce((s, i) => s + i.amount, 0);
            const seg = STATIC_SPLIT.find(s => s.kind === section.kind);
            const pct = seg?.actual || 0;
            const onTrack = Math.abs(pct - section.target) < 5;
            return (
              <div key={section.kind} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: section.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{section.label}</span>
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--ink)' }}>{fmt$(total)}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999, marginLeft: 8,
                      background: onTrack ? 'var(--green-soft)' : 'rgba(242,95,92,0.1)',
                      color: onTrack ? 'var(--green)' : 'var(--red)',
                      fontWeight: 600,
                    }}>{fmtPct(pct, 0)} of expenses</span>
                  </div>
                </div>
                <ProgressBar pct={(pct / section.target) * 100} color={section.color} height={6} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: 'var(--ink-muted)' }}>
                  <span>0%</span>
                  <span>Target: {section.target}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {CATEGORIES_BY_KIND.map(section => (
        <div key={section.kind}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: section.color, display: 'inline-block' }} />
            {section.label} breakdown
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {section.items.map((item, i) => {
              const sectionTotal = section.items.reduce((s, it) => s + it.amount, 0);
              const itemPct = (item.amount / sectionTotal) * 100;
              return (
                <div key={item.name} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px', alignItems: 'center',
                  gap: 14, padding: '11px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.name}</div>
                  <div style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink)', textAlign: 'right' }}>
                    {fmt$(item.amount, { cents: true })}
                  </div>
                  <ProgressBar pct={itemPct} color={section.color} height={6} />
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {itemPct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
