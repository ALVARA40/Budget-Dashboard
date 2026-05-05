import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Donut } from '../components/charts/Donut';
import { fmt$ } from '../lib/format';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SPLIT_CONFIG = [
  { bucket: 'Needs',   color: '#7C5CFC', target: 50 },
  { bucket: 'Wants',   color: '#F5B544', target: 30 },
  { bucket: 'Savings', color: '#33C58A', target: 20 },
];

const DEFAULT_WANTS = [
  'dining out','shopping','streaming','movies','concerts','videogames','apps','toys','travel',
  'hotel','beverages','gifts','vacations','hair','gym','clothing','home decor','extracurricular',
];
const DEFAULT_SAVINGS_KINDS = ['savings'];

function defaultBucket(catName: string, kind: string): 'Needs' | 'Wants' | 'Savings' {
  if (DEFAULT_SAVINGS_KINDS.includes(kind)) return 'Savings';
  if (DEFAULT_WANTS.some(w => catName.toLowerCase().includes(w))) return 'Wants';
  if (kind === 'income') return 'Needs'; // income treated separately but still needs a bucket
  return 'Needs';
}

interface CatItem { name: string; kind: string; amount: number; bucket: 'Needs' | 'Wants' | 'Savings' }
interface HistoryMonth { label: string; needs: number; wants: number; savings: number; order: number }

export function Split5030({ year = 2026, month = 4 }: { year?: number; month?: number }) {
  const [loading, setLoading]         = useState(true);
  const [baseCats, setBaseCats]       = useState<CatItem[]>([]);
  const [history, setHistory]         = useState<HistoryMonth[]>([]);
  const [overrides, setOverrides]     = useState<Record<string, 'Needs' | 'Wants' | 'Savings'>>({});
  const [search, setSearch]           = useState('');
  const [filterBucket, setFilterBucket] = useState<string>('All');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const from = year + '-' + String(month).padStart(2,'0') + '-01';
      const to   = new Date(year, month, 0).toISOString().slice(0,10);

      // Load current month
      const { data: curr } = await supabase
        .from('transactions')
        .select('amount, category:categories(name, kind)')
        .eq('user_id', session.user.id)
        .gte('date', from)
        .lte('date', to)
        .lt('amount', 0);

      // Load last 6 months for history
      const histStart = new Date(year, month - 7, 1).toISOString().slice(0,10);
      const { data: hist } = await supabase
        .from('transactions')
        .select('date, amount, category:categories(name, kind)')
        .eq('user_id', session.user.id)
        .gte('date', histStart)
        .lte('date', to)
        .lt('amount', 0);

      if (cancelled) return;

      // Build category map for current month
      const catMap: Record<string, { name: string; kind: string; amount: number }> = {};
      (curr ?? []).forEach((t: any) => {
        const name = t.category?.name ?? 'Other';
        const kind = t.category?.kind ?? 'expense';
        if (!catMap[name]) catMap[name] = { name, kind, amount: 0 };
        catMap[name].amount += Math.abs(t.amount);
      });
      const cats: CatItem[] = Object.values(catMap).map(c => ({
        ...c,
        bucket: defaultBucket(c.name, c.kind),
      })).sort((a, b) => b.amount - a.amount);
      setBaseCats(cats);

      // Build history
      const histMap: Record<string, HistoryMonth> = {};
      (hist ?? []).forEach((t: any) => {
        const d = new Date(t.date + 'T12:00:00');
        const key = d.getFullYear() * 100 + (d.getMonth() + 1);
        const sk = String(key);
        if (!histMap[sk]) histMap[sk] = { label: MONTH_NAMES[d.getMonth()], needs: 0, wants: 0, savings: 0, order: key };
        const name = t.category?.name ?? 'Other';
        const kind = t.category?.kind ?? 'expense';
        const bucket = defaultBucket(name, kind);
        histMap[sk][bucket.toLowerCase() as 'needs'|'wants'|'savings'] += Math.abs(t.amount);
      });
      const histArr = Object.values(histMap).sort((a, b) => a.order - b.order).slice(-6);
      setHistory(histArr);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  const items: CatItem[] = useMemo(() =>
    baseCats.map(c => ({ ...c, bucket: overrides[c.name] ?? c.bucket })),
    [baseCats, overrides]
  );

  const setBucket = (name: string, bucket: 'Needs' | 'Wants' | 'Savings') =>
    setOverrides(prev => ({ ...prev, [name]: bucket }));

  const totals = useMemo(() => {
    const t = { Needs: 0, Wants: 0, Savings: 0 };
    items.forEach(c => { t[c.bucket] = (t[c.bucket] || 0) + c.amount; });
    return t;
  }, [items]);

  const totalSpend = totals.Needs + totals.Wants + totals.Savings || 1;

  const splitData = SPLIT_CONFIG.map(cfg => {
    const b = cfg.bucket as 'Needs' | 'Wants' | 'Savings';
    return {
      ...cfg,
      value: totals[b],
      actual: (totals[b] / totalSpend) * 100,
    };
  });

  const bucketColor = (b: string) => SPLIT_CONFIG.find(s => s.bucket === b)?.color ?? '#999';

  const filtered = items.filter(it => {
    if (filterBucket !== 'All' && it.bucket !== filterBucket) return false;
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Loading your data…</div>
      ) : (
        <>
          {/* Main two-column: donut + category panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

            {/* Donut + split bars */}
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                Your split · {MONTH_NAMES_FULL[month - 1]}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>
                Based on {fmt$(totalSpend)} across {items.length} categories
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <Donut
                  data={splitData.map(s => ({ value: s.value, color: s.color }))}
                  size={220} thickness={30}
                  centerLabel="Needs share"
                  centerValue={Math.round(splitData[0].actual) + '%'}
                  bg="var(--bg)"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {splitData.map(s => {
                  const delta = s.actual - s.target;
                  const onTrack = Math.abs(delta) <= 5;
                  return (
                    <div key={s.bucket}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.bucket}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 7px', borderRadius: 999,
                            background: onTrack ? 'var(--green-soft)' : 'rgba(242,95,92,0.1)',
                            color: onTrack ? 'var(--green)' : 'var(--red)', fontWeight: 700,
                          }}>
                            {onTrack ? 'On track' : (delta > 0 ? '+' + delta.toFixed(1) + 'pp' : delta.toFixed(1) + 'pp')}
                          </span>
                        </div>
                        <div style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>
                          <b>{fmt$(s.value)}</b>
                          <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}> · {s.actual.toFixed(1)}% / {s.target}%</span>
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 6, background: 'var(--bg)', borderRadius: 999 }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: Math.min(100, s.actual) + '%', background: s.color, borderRadius: 999 }} />
                        <div style={{ position: 'absolute', top: -3, left: s.target + '%', width: 2, height: 12, background: 'var(--ink)', borderRadius: 1, transform: 'translateX(-1px)' }} title={'Target ' + s.target + '%'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category reassignment panel */}
            <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Adjust category assignments</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>All {items.length} categories — click a chip to reassign.</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 999, padding: '6px 12px', flex: 1,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'Search ' + items.length + ' categories…'}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: 'var(--ink)', fontFamily: 'inherit' }} />
                </div>
                {(['All', 'Needs', 'Wants', 'Savings'] as const).map(f => (
                  <div key={f} onClick={() => setFilterBucket(f)} style={{
                    padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
                    background: filterBucket === f ? (f === 'All' ? 'var(--ink)' : bucketColor(f)) : 'transparent',
                    color: filterBucket === f ? '#fff' : 'var(--ink-soft)',
                    border: '1px solid ' + (filterBucket === f ? 'transparent' : 'var(--line)'),
                  }}>{f}</div>
                ))}
              </div>

              <div style={{ flex: 1, overflow: 'auto', maxHeight: 420, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {filtered.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)' }}>No categories match your search.</div>
                )}
                {filtered.map(it => (
                  <div key={it.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10, gap: 8,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 1 }}>
                        {fmt$(it.amount)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['Needs', 'Wants', 'Savings'] as const).map(b => {
                        const isOn = it.bucket === b;
                        const c = bucketColor(b);
                        return (
                          <div key={b} onClick={() => setBucket(it.name, b)} style={{
                            padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                            background: isOn ? c + '22' : 'transparent',
                            color: isOn ? c : 'var(--ink-muted)',
                            border: '1px solid ' + (isOn ? c : 'var(--line)'),
                          }}>{b}</div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--ink-muted)', textAlign: 'center' }}>
                Showing {filtered.length} of {items.length} categories
              </div>
            </div>
          </div>

          {/* 6-month history strip */}
          {history.length > 0 && (
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>History · last 6 months</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                {history.map((m, i) => {
                  const total = m.needs + m.wants + m.savings || 1;
                  const needsPct  = Math.round((m.needs  / total) * 100);
                  const wantsPct  = Math.round((m.wants  / total) * 100);
                  const savingsPct = Math.round((m.savings / total) * 100);
                  return (
                    <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{m.label}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <Donut
                          data={[
                            { value: m.needs,   color: SPLIT_CONFIG[0].color },
                            { value: m.wants,   color: SPLIT_CONFIG[1].color },
                            { value: m.savings, color: SPLIT_CONFIG[2].color },
                          ]}
                          size={78} thickness={12}
                          bg="var(--bg)"
                        />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink)', fontWeight: 600 }}>
                        {needsPct}% / {wantsPct}% / {savingsPct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
