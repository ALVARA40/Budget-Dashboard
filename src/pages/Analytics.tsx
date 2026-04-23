import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { fmt$, fmtPct } from '../lib/format';
import { DeltaPill } from '../components/ui/DeltaPill';

const FULL_FLOW = [
  { m: 'May', income: 16800, expenses: 11200 },
  { m: 'Jun', income: 17100, expenses: 12800 },
  { m: 'Jul', income: 17500, expenses: 11900 },
  { m: 'Aug', income: 18200, expenses: 13400 },
  { m: 'Sep', income: 17800, expenses: 12600 },
  { m: 'Oct', income: 18100, expenses: 11800 },
  { m: 'Nov', income: 17504, expenses: 12378 },
  { m: 'Dec', income: 18840, expenses: 12323 },
  { m: 'Jan', income: 57207, expenses: 17916 },
  { m: 'Feb', income: 18563, expenses: 22042 },
  { m: 'Mar', income: 80607, expenses: 55685 },
  { m: 'Apr', income: 38632, expenses: 23285 },
];

const TOP_CATEGORIES = [
  { name: 'Mortgage/Rent',        total: 26601.48, color: '#7C5CFC' },
  { name: 'Federal Tax',          total: 16000.80, color: '#4BA3F7' },
  { name: 'Work Income',          total: 56478.48, color: '#33C58A' },
  { name: 'Groceries',            total:  7167.36, color: '#F25F5C' },
  { name: 'Social Security/FICA', total:  6174.72, color: '#9B7BFF' },
  { name: 'Shopping',             total:  3672.00, color: '#F5B544' },
];

export function Analytics() {
  const totalIncome   = FULL_FLOW.reduce((s, f) => s + f.income, 0);
  const totalExpenses = FULL_FLOW.reduce((s, f) => s + f.expenses, 0);
  const totalSavings  = totalIncome - totalExpenses;
  const avgRate       = (totalSavings / totalIncome) * 100;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.02em' }}>Analytics</div>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:3 }}>12-month trend - May 2025 to April 2026</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {[
          { label:'Total income (12m)',   value:fmt$(totalIncome),   delta:+6.4,  color:'#2FB37A', goodOnUp:true  },
          { label:'Total expenses (12m)', value:fmt$(totalExpenses), delta:-2.1,  color:'#D8443F', goodOnUp:false },
          { label:'Net savings (12m)',    value:fmt$(totalSavings),  delta:+11.8, color:'#7FB3E8', goodOnUp:true  },
          { label:'Avg savings rate',     value:fmtPct(avgRate, 1),  delta:+3.2,  color:'#1F3F8A', goodOnUp:true  },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontSize:11.5, color:'var(--ink-soft)', fontWeight:500 }}>{k.label}</div>
              <DeltaPill value={k.delta} goodOnUp={k.goodOnUp} />
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.02em' }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding:'20px 24px' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:4 }}>Money flow - 12 months</div>
        <div style={{ fontSize:12, color:'var(--ink-soft)', marginBottom:16, display:'flex', gap:14 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:999, background:'var(--brand)', display:'inline-block' }} /> Income
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:999, background:'var(--expense-bar)', display:'inline-block' }} /> Expenses
          </span>
        </div>
        <MoneyFlowChart data={FULL_FLOW} height={240} />
      </div>
      <div className="card" style={{ padding:'20px 24px' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:16 }}>Top categories (12 months)</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {TOP_CATEGORIES.map(cat => {
            const pct = (cat.total / totalIncome) * 100;
            return (
              <div key={cat.name} style={{ display:'grid', gridTemplateColumns:'1fr 100px 200px 60px', alignItems:'center', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:10, height:10, borderRadius:999, background:cat.color, display:'inline-block' }} />
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{cat.name}</span>
                </div>
                <div style={{ fontSize:13, fontVariantNumeric:'tabular-nums', fontWeight:600, color:'var(--ink)', textAlign:'right' }}>{fmt$(cat.total)}</div>
                <div style={{ width:'100%', height:8, background:'var(--line)', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100, pct * 2)}%`, height:'100%', background:cat.color, borderRadius:999 }} />
                </div>
                <div style={{ fontSize:11.5, color:'var(--ink-muted)', fontVariantNumeric:'tabular-nums', textAlign:'right' }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
