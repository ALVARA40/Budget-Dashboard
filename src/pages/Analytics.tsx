import { useState, useEffect, useRef, useMemo } from 'react';
import type { GlobalFilters } from '../App';
import { supabase } from '../lib/supabase';
import { MoneyFlowChart } from '../components/charts/MoneyFlowChart';
import { Donut } from '../components/charts/Donut';
import { fmt$, fmtPct } from '../lib/format';

const CAT_COLORS = ['#7C5CFC','#4BA3F7','#33C58A','#F25F5C','#F5B544','#9B7BFF','#E6A214','#1F9D6E'];
const BANK_COLORS = ['#7C5CFC','#4BA3F7','#33C58A','#F5B544','#D8443F','#1F3F8A','#E6A214','#9B7BFF'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface FlowMonth { m: string; income: number; expenses: number; order: number }
interface CatTotal  { name: string; total: number; color: string }
interface BankTotal { name: string; total: number; color: string }

// --- Cumulative sparkline ---
interface SparkPoint { x: number; y: number }
function CumulativeSparkline({ data, width = 900, height = 160 }: { data: FlowMonth[]; width?: number; height?: number }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nets = data.map(f => f.income - f.expenses);
  const cumulative: number[] = [];
  nets.forEach((n, i) => cumulative.push((cumulative[i - 1] ?? 0) + n));

  if (cumulative.length === 0) return null;

  const pad = { t: 16, b: 28, l: 56, r: 16 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const min = Math.min(0, ...cumulative);
  const max = Math.max(...cumulative);
  const range = max - min || 1;
  const stepX = W / Math.max(1, cumulative.length - 1);

  const pts: SparkPoint[] = cumulative.map((v, i) => ({
    x: pad.l + i * stepX,
    y: pad.t + (1 - (v - min) / range) * H,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const zeroY = pad.t + (1 - (0 - min) / range) * H;
  const area = `${line} L ${pts[pts.length - 1].x} ${zeroY} L ${pts[0].x} ${zeroY} Z`;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    let best = 0; let bestD = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - localX); if (d < bestD) { bestD = d; best = i; } });
    setHover({ i: best, x: pts[best].x, y: pts[best].y });
  }

  const fmtK = (v: number) => {
    if (Math.abs(v) >= 1000) return (v >= 0 ? '+' : '') + '$' + (v / 1000).toFixed(0) + 'K';
    return (v >= 0 ? '+' : '') + fmt$(v);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={pad.l} y1={zeroY} x2={pad.l + W} y2={zeroY} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
        <path d={area} fill="url(#sparkGrad)" />
        <path d={line} stroke="var(--brand)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" fontFamily="inherit">{data[i].m}</text>
        ))}
        {[min, (min + max) / 2, max].map((v, i) => (
          <text key={i} x={pad.l - 6} y={pad.t + (1 - (v - min) / range) * H + 4} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" fontFamily="inherit">
            {fmtK(v)}
          </text>
        ))}
        {hover && (
          <>
            <line x1={pts[hover.i].x} y1={pad.t} x2={pts[hover.i].x} y2={pad.t + H} stroke="var(--brand)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={pts[hover.i].x} cy={pts[hover.i].y} r={5} fill="#fff" stroke="var(--brand)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hover && (
        <div style={{
          position: 'absolute',
          left: pts[hover.i].x,
          top: pts[hover.i].y,
          transform: 'translate(-50%, -110%)',
          background: 'var(--ink)', color: '#fff',
          padding: '7px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 500,
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 30,
          boxShadow: '0 10px 22px -8px rgba(15,14,26,0.35)',
        }}>
          <div style={{ color: '#BFB6F5', fontSize: 9.5, letterSpacing: '0.04em', marginBottom: 2 }}>{data[hover.i].m}</div>
          <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtK(cumulative[hover.i])}</div>
          <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--ink)' }} />
        </div>
      )}
    </div>
  );
}

// --- Main ---
export function Analytics({ year = 2026, month = 4, refreshKey = 0, filters }: { year?: number; month?: number; refreshKey?: number; filters?: GlobalFilters }) {
  const [rawAll,  setRawAll]  = useState<{ date: string; amount: number; description?: string; category: { name: string; kind: string } | null; bank: { name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState<'3M'|'6M'|'12M'|'YTD'|'All'>('6M');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const endDate   = new Date(year, month, 0).toISOString().slice(0, 10);
      const startDate = new Date(year, month - 12, 1).toISOString().slice(0, 10);

      let all: { date: string; amount: number; category: { name: string; kind: string } | null; bank: { name: string } | null }[] = [];
      let offset = 0;
      const BATCH = 1000;
      while (true) {
        const { data } = await supabase
          .from('transactions')
          .select('date, amount, category:categories(name, kind), bank:banks(name)')
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

      setRawAll(all);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year, month, refreshKey]);

  // Apply global filters reactively — no re-fetch needed
  const filteredAll = useMemo(() => rawAll.filter((t: typeof rawAll[0]) => {
    if (filters?.category && filters.category !== 'All' && t.category?.name !== filters.category) return false;
    if (filters?.bank     && filters.bank     !== 'All' && t.bank?.name     !== filters.bank)     return false;
    if (filters?.search   && filters.search !== '') {
      const q = filters.search.toLowerCase();
      if (!(t as any).description?.toLowerCase().includes(q) &&
          !t.category?.name?.toLowerCase().includes(q) &&
          !t.bank?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rawAll, filters]);

  const flow = useMemo<FlowMonth[]>(() => {
    const flowMap: Record<string, { income: number; expenses: number; order: number; label: string }> = {};
    filteredAll.forEach((t: typeof filteredAll[0]) => {
      const d = new Date(t.date + 'T12:00:00');
      const key = d.getFullYear() * 100 + (d.getMonth() + 1);
      const label = MONTH_NAMES[d.getMonth()];
      const sk = String(key);
      if (!flowMap[sk]) flowMap[sk] = { income: 0, expenses: 0, order: key, label };
      if (t.amount > 0) flowMap[sk].income += t.amount;
      else if (t.category?.kind !== 'savings') flowMap[sk].expenses += Math.abs(t.amount);
    });
    return Object.values(flowMap).sort((a, b) => a.order - b.order)
      .map(v => ({ m: v.label, income: v.income, expenses: v.expenses, order: v.order }));
  }, [filteredAll]);

  const cats = useMemo<CatTotal[]>(() => {
    const catMap: Record<string, number> = {};
    filteredAll.filter((t: typeof filteredAll[0]) => t.amount < 0 && t.category?.kind !== 'savings').forEach((t: typeof filteredAll[0]) => {
      const name = t.category?.name ?? 'Other';
      catMap[name] = (catMap[name] ?? 0) + Math.abs(t.amount);
    });
    return Object.entries(catMap).sort(([, a]: [string,number], [, b]: [string,number]) => b - a).slice(0, 8)
      .map(([name, total], i) => ({ name, total, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [filteredAll]);

  const banks = useMemo<BankTotal[]>(() => {
    const bankMap: Record<string, number> = {};
    filteredAll.filter((t: typeof filteredAll[0]) => t.amount < 0 && t.category?.kind !== 'savings').forEach((t: typeof filteredAll[0]) => {
      const name = t.bank?.name ?? 'Unknown';
      bankMap[name] = (bankMap[name] ?? 0) + Math.abs(t.amount);
    });
    return Object.entries(bankMap).sort(([, a]: [string,number], [, b]: [string,number]) => b - a)
      .map(([name, total], i) => ({ name, total, color: BANK_COLORS[i % BANK_COLORS.length] }));
  }, [filteredAll]);

  // Apply range filter
  const filteredFlow = (() => {
    if (range === 'All') return flow;
    if (range === 'YTD') return flow.filter((f: FlowMonth) => f.order >= year * 100 + 1 && f.order <= year * 100 + month);
    const n = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    return flow.slice(-n);
  })();

  const totalIncome   = filteredFlow.reduce((s: number, f: FlowMonth) => s + f.income, 0);
  const totalExpenses = filteredFlow.reduce((s: number, f: FlowMonth) => s + f.expenses, 0);
  const totalSavings  = totalIncome - totalExpenses;
  const months        = filteredFlow.length || 1;

  const avgIncome   = totalIncome / months;
  const avgExpenses = totalExpenses / months;
  const burnRate    = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const projected   = totalSavings * (12 / months);

  const bankTotal = banks.reduce((s: number, b: BankTotal) => s + b.total, 0);

  const RANGES: Array<'3M'|'6M'|'12M'|'YTD'|'All'> = ['3M','6M','12M','YTD','All'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Analytics</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
          {loading ? 'Loading…' : `12-month trend · ${flow[0]?.m ?? ''} to ${flow[flow.length - 1]?.m ?? ''} ${year}`}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Avg monthly income',   value: loading ? '—' : fmt$(avgIncome),   color: '#2FB37A', sub: `over ${months} months` },
          { label: 'Avg monthly expenses', value: loading ? '—' : fmt$(avgExpenses), color: '#D8443F', sub: `over ${months} months` },
          { label: 'Burn rate',            value: loading ? '—' : fmtPct(burnRate, 1), color: '#7FB3E8', sub: 'expenses ÷ income' },
          { label: 'Projected year-end',   value: loading ? '—' : (projected >= 1000 ? '$' + (projected / 1000).toFixed(0) + 'K' : fmt$(projected)), color: '#1F3F8A', sub: 'at current run-rate' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{k.value}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Cumulative net position */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Cumulative net position</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map(r => (
              <div key={r} onClick={() => setRange(r)} style={{
                padding: '5px 12px', fontSize: 11.5, fontWeight: 600,
                background: range === r ? 'var(--brand)' : 'transparent',
                color: range === r ? '#fff' : 'var(--ink-soft)',
                border: `1px solid ${range === r ? 'var(--brand)' : 'var(--line)'}`,
                borderRadius: 999, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}>{r}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Running total of income − expenses
        </div>
        {loading
          ? <div style={{ height: 180, display: 'grid', placeItems: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</div>
          : <CumulativeSparkline data={filteredFlow} width={920} height={180} />
        }
      </div>

      {/* Money flow bar chart */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Money flow</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16, display: 'flex', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--brand)', display: 'inline-block' }} /> Income
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--expense-bar)', display: 'inline-block' }} /> Expenses
          </span>
        </div>
        {loading
          ? <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Loading chart…</div>
          : <MoneyFlowChart data={filteredFlow} height={200} />
        }
      </div>

      {/* Bottom row: top categories + by bank */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Top spending categories */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Top spending categories</div>
          {loading
            ? <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cats.slice(0, 6).map(cat => {
                  const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: cat.color, display: 'inline-block' }} />
                          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{cat.name}</span>
                        </span>
                        <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {fmt$(cat.total)} <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>· {pct.toFixed(1)}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(100, pct) + '%', background: cat.color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* By bank donut */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
            By bank · {MONTH_NAMES[month - 1]}
          </div>
          {loading
            ? <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Loading…</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <Donut
                  data={banks.slice(0, 6).map(b => ({ value: b.total, color: b.color }))}
                  size={200}
                  thickness={30}
                  centerLabel="Expenses"
                  centerValue={fmt$(bankTotal)}
                  bg="var(--bg)"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                  {banks.slice(0, 6).map(b => {
                    const pct = bankTotal > 0 ? (b.total / bankTotal) * 100 : 0;
                    return (
                      <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 999, background: b.color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{b.name}</span>
                        <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink)' }}>{fmt$(b.total)}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)', width: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
