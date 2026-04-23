import { ALL_CATEGORIES } from '../lib/staticData';
import { fmt$ } from '../lib/format';
import { ProgressBar } from '../components/charts/ProgressBar';

// Static budget data derived from Excel Budget Planning sheet
const BUDGET_ROWS = [
  // Income
  { kind: 'income',  name: 'Work Income',         budget: 9413.08,  icon: '💼' },
  { kind: 'income',  name: 'Business Income',      budget: 9413.08,  icon: '🏢' },
  { kind: 'income',  name: 'Investment Income',    budget: 9413.08,  icon: '📈' },
  { kind: 'income',  name: 'Side Hustle Income',   budget: 9413.08,  icon: '⚡' },
  { kind: 'income',  name: 'Other Income',         budget: 980.80,   icon: '💰' },
  // Needs
  { kind: 'need',    name: 'Mortgage/Rent',        budget: 4433.58,  icon: '🏠' },
  { kind: 'need',    name: 'Federal Tax',          budget: 2667.00,  icon: '🏛️' },
  { kind: 'need',    name: 'Social Security/FICA', budget: 1029.40,  icon: '🔒' },
  { kind: 'need',    name: 'Health Insurance',     budget: 735.10,   icon: '🏥' },
  { kind: 'need',    name: 'Groceries',            budget: 850.00,   icon: '🛒' },
  { kind: 'need',    name: 'Car Purchase',         budget: 495.78,   icon: '🚗' },
  { kind: 'need',    name: 'Fuel',                 budget: 150.00,   icon: '⛽' },
  { kind: 'need',    name: 'Cell Phone',           budget: 80.00,    icon: '📱' },
  { kind: 'need',    name: 'Internet',             budget: 60.00,    icon: '🌐' },
  { kind: 'need',    name: 'Electricity',          budget: 120.00,   icon: '💡' },
  // Wants
  { kind: 'want',    name: 'Dining out',           budget: 450.00,   icon: '🍽️' },
  { kind: 'want',    name: 'Shopping',             budget: 550.00,   icon: '🛍️' },
  { kind: 'want',    name: 'Entertainment',        budget: 200.00,   icon: '🎬' },
  { kind: 'want',    name: 'Streaming services',   budget: 50.00,    icon: '📺' },
  { kind: 'want',    name: 'Gym Membership',       budget: 60.00,    icon: '💪' },
  // Savings
  { kind: 'savings', name: '401k',                 budget: 2000.00,  icon: '🏦' },
  { kind: 'savings', name: 'Emergency Fund',       budget: 1000.00,  icon: '🛡️' },
  { kind: 'savings', name: 'Roth IRA',             budget: 500.00,   icon: '📊' },
];

const SECTION_LABELS: Record<string, string> = {
  income: 'Income', need: 'Needs (Essential)', want: 'Wants (Lifestyle)', savings: 'Savings & Investments',
};
const SECTION_COLORS: Record<string, string> = {
  income: '#33C58A', need: '#7C5CFC', want: '#F5B544', savings: '#4BA3F7',
};

export function BudgetPlanning() {
  const kinds = ['income', 'need', 'want', 'savings'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Budget Planning</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>Set monthly targets by category · April 2026</div>
      </div>

      {kinds.map(kind => {
        const rows = BUDGET_ROWS.filter(r => r.kind === kind);
        const total = rows.reduce((s, r) => s + r.budget, 0);
        return (
          <div key={kind}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: SECTION_COLORS[kind], display: 'inline-block' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{SECTION_LABELS[kind]}</span>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                Total: <b style={{ color: 'var(--ink)' }}>{fmt$(total)}</b>
              </span>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {rows.map((row, i) => (
                <div key={row.name} style={{
                  display: 'grid', gridTemplateColumns: '30px 1fr 120px 150px', alignItems: 'center',
                  gap: 14, padding: '12px 18px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                }}>
                  <span style={{ fontSize: 16 }}>{row.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{row.name}</div>
                  <div style={{ paddingRight: 8 }}>
                    <ProgressBar pct={75} color={SECTION_COLORS[kind]} height={6} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      defaultValue={row.budget.toFixed(2)}
                      style={{
                        width: '100%', border: '1px solid var(--line)', borderRadius: 8,
                        padding: '6px 10px', fontSize: 12.5, fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600, color: 'var(--ink)', background: 'var(--bg)',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
