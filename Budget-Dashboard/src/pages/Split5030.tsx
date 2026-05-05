import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Donut } from '../components/charts/Donut';
import { ProgressBar } from '../components/charts/ProgressBar';
import { fmt$, fmtPct } from '../lib/format';
import type { Transaction } from '../types/index';

const KIND_CONFIG = [
  { kind: 'need',    label: 'Needs',   color: '#7C5CFC', target: 50 },
  { kind: 'want',    label: 'Wants',   color: '#F5B544', target: 30 },
  { kind: 'savings', label: 'Savings', color: '#33C58A', target: 20 },
];

const MONTH_NAMES_SP = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function Split5030({ year = 2026, month = 4 }: { year?: number; month?: number }) {
  const [txns, setTxns]       = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const from = year + '-' + String(month).padStart(2,'0') + '-01';
      const to   = new Date(year, month, 0).toISOString().slice(0,10);

      const { data } = await supabase
        .from('transactions')
        .select('*, category:categories(*), bank:banks(*), company:companies(*)')
        .eq('user_id', session.user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (cancelled) return;
      setTxns((data as Transaction[]) ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  const expenseTxns  = txns.filter(t => t.amount < 0);
  const needTotal    = expenseTxns.filter(t => t.category?.kind === 'need').reduce((s,t) => s + Math.abs(t.amount), 0);
  const wantTotal    = expenseTxns.filter(t => t.category?.kind === 'want').reduce((s,t) => s + Math.abs(t.amount), 0);
  const savingsTotal = expenseTxns.filter(t => t.category?.kind === 'savings').reduce((s,t) => s + Math.abs(t.amount), 0);
  const totalDenom   = needTotal + wantTotal + savingsTotal || 1;

  const splitData = KIND_CONFIG.map(cfg => {
    const value  = cfg.kind === 'need' ? needTotal : cfg.kind === 'want' ? wantTotal : savingsTotal;
    const actual = Math.round((value / totalDenom) * 100);
    return { ...cfg, value, actual };
  });

  const catsByKind: Record<string, { name: string; amount: number }[]> = { need: [], want: [], savings: [] };
  expenseTxns.forEach(t => {
    const kind = t.category?.kind ?? '';
    if (!catsByKind[kind]) return;
    const name = t.category?.name ?? 'Other';
    const existing = catsByKind[kind].find(c => c.name === name);
    if (existing) existing.amount += Math.abs(t.amount);
    else catsByKind[kind].push({ name, amount: Math.abs(t.amount) });
  });
  Object.keys(catsByKind).forEach(k => catsByKind[k].sort((a, b) => b.amount - a.amount));

  const subtitle = MONTH_NAMES_SP[month - 1] + ' ' + year;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.02em' }}>50 / 30 / 20</div>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:3 }}>
          {loading ? 'Loading...' : ('Needs · Wants · Savings · ' + subtitle)}
        </div>
      </div>

      {loading ? (
        <div style={{ padding:'48px 0', textAlign:'center', color:'var(--ink-muted)', fontSize:13 }}>Loading your data...</div>
      ) : (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:18, marginBottom:22 }}>
            <div className="card" style={{ padding:'24px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
              <Donut
                data={splitData.map(s => ({ value: s.value, color: s.color }))}
                size={180} thickness={28}
                centerLabel="Of expenses"
                centerValue={fmtPct(splitData[0].actual, 0)}
                bg="var(--bg)"
              />
              <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }}>
                {splitData.map(s => (
                  <div key={s.kind} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:999, background:s.color, display:'inline-block', flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:12.5, fontWeight:500, color:'var(--ink)' }}>{s.label}</span>
                    <span style={{ fontSize:12.5, fontVariantNumeric:'tabular-nums', fontWeight:700, color:'var(--ink)' }}>{fmtPct(s.actual, 0)}</span>
                    <span style={{
                      fontSize:11, padding:'2px 7px', borderRadius:999,
                      background: Math.abs(s.actual - s.target) < 5 ? 'var(--green-soft)' : 'rgba(242,95,92,0.1)',
                      color:      Math.abs(s.actual - s.target) < 5 ? 'var(--green)'      : 'var(--red)',
                      fontWeight:600,
                    }}>{'target ' + s.target + '%'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {splitData.map(s => {
                const onTrack = Math.abs(s.actual - s.target) < 5;
                return (
                  <div key={s.kind} className="card" style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:999, background:s.color, display:'inline-block' }} />
                        <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{s.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:13, fontVariantNumeric:'tabular-nums', fontWeight:700, color:'var(--ink)' }}>{fmt$(s.value)}</span>
                        <span style={{
                          fontSize:11, padding:'2px 8px', borderRadius:999, marginLeft:8,
                          background: onTrack ? 'var(--green-soft)' : 'rgba(242,95,92,0.1)',
                          color:      onTrack ? 'var(--green)'      : 'var(--red)',
                          fontWeight:600,
                        }}>{fmtPct(s.actual, 0) + ' of expenses'}</span>
                      </div>
                    </div>
                    <ProgressBar pct={s.target > 0 ? (s.actual / s.target) * 100 : 0} color={s.color} height={6} />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10.5, color:'var(--ink-muted)' }}>
                      <span>0%</span>
                      <span>{'Target: ' + s.target + '%'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {KIND_CONFIG.map(cfg => {
            const items = catsByKind[cfg.kind] ?? [];
            if (items.length === 0) return null;
            const sectionTotal = items.reduce((s, i) => s + i.amount, 0);
            return (
              <div key={cfg.kind} style={{ marginBottom:18 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'var(--ink)', marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:10, height:10, borderRadius:999, background:cfg.color, display:'inline-block' }} />
                  {cfg.label + ' breakdown'}
                </div>
                <div className="card" style={{ overflow:'hidden' }}>
                  {items.map((item, i) => {
                    const itemPct = sectionTotal > 0 ? (item.amount / sectionTotal) * 100 : 0;
                    return (
                      <div key={item.name} style={{
                        display:'grid', gridTemplateColumns:'1fr 100px 180px 80px', alignItems:'center',
                        gap:14, padding:'11px 20px',
                        borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                      }}>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{item.name}</div>
                        <div style={{ fontSize:12.5, fontVariantNumeric:'tabular-nums', fontWeight:600, color:'var(--ink)', textAlign:'right' }}>
                          {fmt$(item.amount, { cents:true })}
                        </div>
                        <ProgressBar pct={itemPct} color={cfg.color} height={6} />
                        <div style={{ fontSize:11, color:'var(--ink-muted)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                          {itemPct.toFixed(1) + '%'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
