import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { fmt$, fmtPct } from '../lib/format';

const CAT_COLORS = ['#7C5CFC','#4BA3F7','#33C58A','#F25F5C','#F5B544','#9B7BFF','#E6A214','#1F9D6E','#D8443F','#4B9BF5'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface FlowMonth { m: string; income: number; expenses: number }
interface CatTotal  { name: string; total: number; color: string }

export function Analytics({ year = 2026, month = 4 }: { year?: number; month?: number }) {
  const [flow, setFlow]       = useState<FlowMonth[]>([]);
  const [cats, setCats]       = useState<CatTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const endDate   = new Date(year, month, 0).toISOString().slice(0, 10);
      const startDate = new Date(year, month - 12, 1).toISOString().slice(0, 10);

      let all: { date: string; amount: number; category: { name: string; kind: string } | null }[] = [];
      let offset = 0;
      const BATCH = 1000;
      while (true) {
        const { data } = await supabase
          .from('transactions')
          .select('date, amount, category:categories(name, kind)')
          .eq('user_id', session.user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .range(offset, offset + BATCH - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data as unknown as typeof all);
        if (data.length < BATCH) break;
        offset += BATCH;
      }

      if (cancelled) return;

      // Group by calendar month for flow chart
      const flowMap: Record<string, { income: number; expenses: number; order: number; label: string }> = {};
      all.forEach(t => {
        const d     = new Date(t.date + 'T12:00:00');
        const key   = d.getFullYear() * 100 + (d.getMonth() + 1);
        const label = MONTH_NAMES[d.getMonth()];
        const sk    = String(key);
        if (!flowMap[sk]) flowMap[sk] = { income: 0, expenses: 0, order: key, label };
        if (t.amount > 0) flowMap[sk].income   += t.amount;
        else              flowMap[sk].expenses  += Math.abs(t.amount);
      });

      const flowArr: FlowMonth[] = Object.values(flowMap)
        .sort((a, b) => a.order - b.order)
        .map(v => ({ m: v.label, income: v.income, expenses: v.expenses }));

      // Top categories by absolute spend
      const catMap: Record<string, number> = {};
      all.filter(t => t.amount < 0).forEach(t => {
        const name = t.category?.name ?? 'Other';
        catMap[name] = (catMap[name] ?? 0) + Math.abs(t.amount);
      });
      const catsArr: CatTotal[] = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, total], i) => ({ name, total, color: CAT_COLORS[i % CAT_COLORS.length] }));

      setFlow(flowArr);
      setCats(catsArr);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  const totalIncome   = flow.reduce((s, f) => s + f.income, 0);
  const totalExpenses = flow.reduce((s, f) => s + f.expenses, 0);
  const totalSavings  = totalIncome - totalExpenses;
  const avgRate       = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const startM     = new Date(year, month - 12, 1);
  const startLabel = MONTH_NAMES[startM.getMonth()] + ' ' + startM.getFullYear();
  const endLabel   = MONTH_NAMES[month - 1] + ' ' + year;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.02em' }}>Analytics</div>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:3 }}>
          {loading ? 'Loading...' : ('12-month trend · ' + startLabel + ' to ' + endLabel)}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {[
          { label:'Total income (12m)',   value: loading ? '—' : fmt$(totalIncome),   color:'#2FB37A' },
          { label:'Total expenses (12m)', value: loading ? '—' : fmt$(totalExpenses), color:'#D8443F' },
          { label:'Net savings (12m)',    value: loading ? '—' : fmt$(totalSavings),  color:'#7FB3E8' },
          { label:'Avg savings rate',     value: loading ? '—' : fmtPct(avgRate, 1), color:'#1F3F8A' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11.5, color:'var(--ink-soft)', fontWeight:500, marginBottom:8 }}>{k.label}</div>
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
        {loading
          ? <div style={{ height:240, display:'grid', placeItems:'center', color:'var(--ink-muted)', fontSize:13 }}>Loading chart...</div>
          : <MoneyFlowChart data={flow} height={240} />
        }
      </div>

      <div className="card" style={{ padding:'20px 24px' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:16 }}>Top expense categories (12 months)</div>
        {loading
          ? <div style={{ padding:'24px 0', textAlign:'center', color:'var(--ink-muted)', fontSize:13 }}>Loading...</div>
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {cats.map(cat => {
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                return (
                  <div key={cat.name} style={{ display:'grid', gridTemplateColumns:'1fr 100px 200px 60px', alignItems:'center', gap:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:10, height:10, borderRadius:999, background:cat.color, display:'inline-block' }} />
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{cat.name}</span>
                    </div>
                    <div style={{ fontSize:13, fontVariantNumeric:'tabular-nums', fontWeight:600, color:'var(--ink)', textAlign:'right' }}>{fmt$(cat.total)}</div>
                    <div style={{ width:'100%', height:8, background:'var(--line)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ width:(Math.min(100, pct) + '%'), height:'100%', background:cat.color, borderRadius:999 }} />
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--ink-muted)', fontVariantNumeric:'tabular-nums', textAlign:'right' }}>{pct.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
