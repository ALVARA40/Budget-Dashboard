import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBudgetPlan } from '../lib/useBudgetPlan';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_MONTH_IDX = 3; // April

interface PlanRow { name: string; y2024: number; y2025: number; monthly: number[] }

// ─── Planning data ───────────────────────────────────────────────────────────
const PLANNING_DATA = {
  income: [
    { name: 'Work Income',               y2024: 33000,   y2025: 202455,  monthly: [16335,16335,16335,17505,17505,17505,17505,17505,17505,17505,17505,17505] },
    { name: 'Rental Income',             y2024: 0,       y2025: 12067,   monthly: [0,0,0,0,0,0,0,0,0,0,0,0] },
    { name: 'Other Income',              y2024: 0,       y2025: 1500,    monthly: [0,0,2435,1245,1245,1245,1245,1245,1245,1245,1245,1245] },
    { name: 'Spouse Income',             y2024: 240628,  y2025: 22533,   monthly: [40040,1561,90,13355,90,90,90,90,90,90,90,90] },
    { name: 'Work Income (GDP, Extras)', y2024: 0,       y2025: 73877,   monthly: [0,0,60743,0,0,0,0,0,0,0,0,0] },
  ] as PlanRow[],
  expenses: [
    { name: 'Cable/Satellite',            y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Communications',             y2024: 160,   y2025: 1063,   monthly: Array(12).fill(123) },
    { name: 'Electric',                   y2024: 0,     y2025: 1315,   monthly: [130,160,120,120,120,145,185,185,185,180,135,120] },
    { name: 'Gas',                        y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'House Cleaning Service',     y2024: 5000,  y2025: 24450,  monthly: [165,80,80,80,80,80,80,80,80,80,80,80] },
    { name: 'Home Decor',                 y2024: 0,     y2025: 841,    monthly: [240,0,0,0,0,0,0,240,0,0,0,0] },
    { name: 'Internet Service',           y2024: 140,   y2025: 6800,   monthly: Array(12).fill(0) },
    { name: 'Maintenance',                y2024: 0,     y2025: 41939,  monthly: [3818,5773,15773,4433,4433,4433,4433,4433,4433,4433,4433,4433] },
    { name: 'Mortgage/Rent',              y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Natural Gas/Oil',            y2024: 0,     y2025: 106,    monthly: Array(12).fill(0) },
    { name: 'Security',                   y2024: 0,     y2025: 345,    monthly: [85,0,0,0,0,85,0,0,85,0,0,0] },
    { name: 'Waste Removal & Recycle',    y2024: 0,     y2025: 380,    monthly: Array(12).fill(35) },
    { name: 'Water & Sewer',              y2024: 215,   y2025: 2895,   monthly: [200,200,200,225,225,225,225,225,225,225,225,225] },
    { name: 'Fuel',                       y2024: 212,   y2025: 3873,   monthly: [0,0,0,0,0,0,1945,0,0,0,0,0] },
    { name: 'Car Insurance',              y2024: 0,     y2025: 4234,   monthly: [3435,5435,435,435,435,435,435,435,435,435,435,435] },
    { name: 'Car Purchase',               y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Licensing',                  y2024: 30,    y2025: 300,    monthly: [40,30,30,30,40,30,30,30,40,30,30,40] },
    { name: 'Parking & Tolls Fees',       y2024: 0,     y2025: 38000,  monthly: Array(12).fill(0) },
    { name: 'Rideshare Fare',             y2024: 350,   y2025: 11450,  monthly: Array(12).fill(850) },
    { name: 'Vehicle Payment',            y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Groceries',                  y2024: 23,    y2025: 321,    monthly: Array(12).fill(30) },
    { name: 'AD&D Insurance',             y2024: 0,     y2025: 1694,   monthly: Array(12).fill(129) },
    { name: 'Critical Illness Insurance', y2024: 1152,  y2025: 16131,  monthly: Array(12).fill(735) },
    { name: 'Legal Services',             y2024: 39,    y2025: 555,    monthly: Array(12).fill(53) },
    { name: 'Life Insurance',             y2024: 45,    y2025: 632,    monthly: Array(12).fill(28) },
    { name: 'Vision Insurance',           y2024: 0,     y2025: 4444,   monthly: Array(12).fill(378) },
    { name: 'Vacations Purchase',         y2024: 23,    y2025: 277,    monthly: Array(12).fill(23) },
    { name: 'Equity Net Value',           y2024: 0,     y2025: 762,    monthly: Array(12).fill(60) },
    { name: 'Banking expenses',           y2024: 4436,  y2025: 44750,  monthly: [2514,2514,14274,2667,2514,2514,2514,2514,2514,2514,2514,2514] },
    { name: 'Medicare',                   y2024: 387,   y2025: 4579,   monthly: [233,233,1114,241,241,241,241,241,241,241,241,241] },
    { name: 'Social Security/FICA',       y2024: 1655,  y2025: 7318,   monthly: [997,997,4763,1029,0,0,0,0,0,0,0,0] },
    { name: 'Speech/OT Therapies',        y2024: 0,     y2025: 0,      monthly: [0,500,600,0,0,0,0,0,0,0,0,0] },
    { name: 'Medical Therapies',          y2024: 0,     y2025: 0,      monthly: [250,1000,750,0,0,0,0,0,0,0,0,0] },
    { name: 'Extracurricular activities', y2024: 8,     y2025: 381,    monthly: [0,0,0,0,0,120,120,120,120,0,0,0] },
    { name: 'Medical Health',             y2024: 0,     y2025: 1500,   monthly: Array(12).fill(100) },
    { name: 'School supplies',            y2024: 0,     y2025: 600,    monthly: Array(12).fill(25) },
    { name: 'School tuition',             y2024: 0,     y2025: 6050,   monthly: Array(12).fill(0) },
    { name: 'Pet Food',                   y2024: 60,    y2025: 336,    monthly: [60,0,0,0,0,60,0,0,60,0,0,60] },
    { name: 'Pet Grooming',               y2024: 0,     y2025: 320,    monthly: [40,0,130,0,0,0,0,130,0,0,130,0] },
    { name: 'Pet Medical',                y2024: 0,     y2025: 1800,   monthly: Array(12).fill(120) },
    { name: 'Beverages/Dessert',          y2024: 29,    y2025: 530,    monthly: Array(12).fill(45) },
    { name: 'Dining out',                 y2024: 410,   y2025: 5000,   monthly: Array(12).fill(450) },
    { name: 'Concerts/Sport events',      y2024: 440,   y2025: 624,    monthly: [20,20,20,20,100,20,20,20,20,20,20,20] },
    { name: 'Streaming services',         y2024: 19,    y2025: 321,    monthly: Array(12).fill(22) },
    { name: 'Videogames',                 y2024: 0,     y2025: 30,     monthly: Array(12).fill(5) },
    { name: 'Clothing',                   y2024: 0,     y2025: 374,    monthly: Array(12).fill(250) },
    { name: 'Hair cut/nails',             y2024: 0,     y2025: 267,    monthly: [0,30,0,0,30,0,0,0,30,0,30,0] },
    { name: 'Shopping',                   y2024: 800,   y2025: 16038,  monthly: [700,550,550,550,550,550,550,550,550,550,550,550] },
    { name: 'Gifts and charity',          y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Airline expenses',           y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Hotel',                      y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
    { name: 'Travel',                     y2024: 0,     y2025: 0,      monthly: Array(12).fill(0) },
  ] as PlanRow[],
  savings: [
    { name: 'Investments',                       y2024: 218151, y2025: 0,     monthly: Array(12).fill(0) },
    { name: 'Stock Portfolio',                   y2024: 0,      y2025: 0,     monthly: Array(12).fill(0) },
    { name: 'Savings Account',                   y2024: 0,      y2025: 5900,  monthly: [750,400,400,400,400,400,400,400,400,400,400,400] },
    { name: 'Retirement Account',                y2024: 0,      y2025: 24242, monthly: [3339,4250,18584,3676,3676,3676,3676,3676,3676,3676,3676,3676] },
    { name: 'Paying off-debt',                   y2024: 0,      y2025: 0,     monthly: Array(12).fill(0) },
    { name: '529 Plan Account',                  y2024: 0,      y2025: 350,   monthly: [150,150,150,0,150,150,150,150,150,150,150,150] },
    { name: 'Retirement Account-Company Match',  y2024: 0,      y2025: 10259, monthly: [2234,0,0,5027,0,0,2234,0,0,2234,0,350] },
    { name: 'Retirement Account-Contribution',   y2024: 0,      y2025: 2310,  monthly: [0,0,2310,0,0,0,0,0,0,0,0,0] },
  ] as PlanRow[],
};

// ─── Color palettes ──────────────────────────────────────────────────────────
const PALETTES = {
  income:   { header: '#2E7D5B', headerBg: '#D8EDE0', rowBg: '#F1F8F4' },
  expenses: { header: '#B84A46', headerBg: '#F8D7D4', rowBg: '#FDEDEC' },
  savings:  { header: '#1F3F8A', headerBg: '#D6E0F3', rowBg: '#EFF3FB' },
};

const LINE = 'var(--line)';
const INK  = 'var(--ink)';
const BRAND = 'var(--brand)';
const BRAND_SOFT = 'var(--brand-soft)';

// ─── KpiMini ─────────────────────────────────────────────────────────────────
function KpiMini({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.02em', marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BudgetPlanning({ year: _year = 2026 }: { year?: number; month?: number }) {
  const [selYear, setSelYear] = useState('2026');
  const [groups, setGroups]   = useState({ income: true, expenses: true, savings: true });
  const [priorYears, setPriorYears] = useState(true);
  const [monthsExpanded, setMonthsExpanded] = useState(true);
  const [edits, setEdits]     = useState<Record<string, number>>({});
  const { saveAll: savePlan, saving: isSaving } = useBudgetPlan(Number(selYear));
  // Actual prior-year totals from Supabase, keyed by category name
  const [actuals, setActuals] = useState<Record<string, { y2024: number; y2025: number }>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadActuals() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('transactions')
        .select('date, amount, category:categories(name)')
        .eq('user_id', session.user.id)
        .gte('date', '2024-01-01')
        .lte('date', '2025-12-31');
      if (cancelled || !data) return;
      const map: Record<string, { y2024: number; y2025: number }> = {};
      (data as any[]).forEach(t => {
        const name = t.category?.name ?? 'Other';
        const y = new Date(t.date + 'T12:00:00').getFullYear();
        if (!map[name]) map[name] = { y2024: 0, y2025: 0 };
        if (y === 2024) map[name].y2024 += Math.abs(t.amount);
        if (y === 2025) map[name].y2025 += Math.abs(t.amount);
      });
      setActuals(map);
    }
    loadActuals();
    return () => { cancelled = true; };
  }, []);

  const editCount = Object.keys(edits).length;

  const cellKey = (group: string, name: string, mi: number) => group + ':' + name + ':' + mi;

  const getValue = (group: string, row: PlanRow, mi: number) => {
    const k = cellKey(group, row.name, mi);
    return k in edits ? edits[k] : row.monthly[mi];
  };

  const setValue = (group: string, name: string, mi: number, v: number) => {
    setEdits(e => ({ ...e, [cellKey(group, name, mi)]: v }));
  };

  const revertAll = () => setEdits({});

  const saveAll = async () => {
    // Build list of all edited rows
    const rows: { category: string; month: number; amount: number }[] = [];
    Object.entries(edits).forEach(([key, amount]) => {
      const [, name, miStr] = key.split(':');
      rows.push({ category: name, month: Number(miStr) + 1, amount });
    });
    const ok = await savePlan(rows);
    if (ok) setEdits({});
    else alert('Save failed — please try again.');
  };

  const toggleGroup = (k: keyof typeof groups) =>
    setGroups(g => ({ ...g, [k]: !g[k] }));

  // Resolve actual prior-year values (Supabase if available, else hardcoded fallback)
  const getActual = (name: string, yr: 'y2024' | 'y2025', fallback: number) =>
    actuals[name] ? Math.round(actuals[name][yr]) : fallback;

  // Totals (edits flow into subtotals & NET row)
  function sumGroup(rows: PlanRow[], groupKey: string) {
    return {
      y2024:   rows.reduce((s, r) => s + getActual(r.name, 'y2024', r.y2024), 0),
      y2025:   rows.reduce((s, r) => s + getActual(r.name, 'y2025', r.y2025), 0),
      monthly: MONTHS.map((_, mi) => rows.reduce((s, r) => s + getValue(groupKey, r, mi), 0)),
      year:    rows.reduce((s, r) => s + MONTHS.reduce((_a, _m, mi) => _a + getValue(groupKey, r, mi), 0), 0),
    };
  }

  const iTot = sumGroup(PLANNING_DATA.income,   'income');
  const eTot = sumGroup(PLANNING_DATA.expenses, 'expenses');
  const sTot = sumGroup(PLANNING_DATA.savings,  'savings');

  const toBeAllocated     = MONTHS.map((_, mi) => iTot.monthly[mi] - eTot.monthly[mi] - sTot.monthly[mi]);
  const toBeAllocatedY24  = iTot.y2024 - eTot.y2024 - sTot.y2024;
  const toBeAllocatedY25  = iTot.y2025 - eTot.y2025 - sTot.y2025;
  const toBeAllocatedYear = iTot.year  - eTot.year  - sTot.year;

  const fmt = (n: number) => n === 0 ? '–' : n.toLocaleString('en-US');

  const labelW = 220;

  // ── Header cell helpers ────────────────────────────────────────────────────
  function headerCellStyle(pal: typeof PALETTES.income): React.CSSProperties {
    return {
      background: pal.headerBg, color: pal.header,
      padding: '8px 7px', fontWeight: 700, fontSize: 11, textAlign: 'right',
      borderTop: '2px solid ' + LINE, borderBottom: '1px solid ' + LINE,
      fontVariantNumeric: 'tabular-nums',
    };
  }

  function cellStyle(pal: typeof PALETTES.income): React.CSSProperties {
    return {
      background: pal.rowBg,
      padding: '5px 7px', fontSize: 11.5, textAlign: 'right', color: INK,
      borderBottom: '1px solid ' + LINE,
      fontVariantNumeric: 'tabular-nums',
    };
  }

  function subtotalCellStyle(pal: typeof PALETTES.income): React.CSSProperties {
    return {
      background: pal.rowBg, color: pal.header,
      padding: '7px 7px', fontSize: 11.5, fontWeight: 800, textAlign: 'right',
      borderTop: '1px solid ' + pal.header + '33', borderBottom: '2px solid ' + pal.header,
      fontVariantNumeric: 'tabular-nums',
    };
  }

  function totalsHeaderCellStyle(): React.CSSProperties {
    return {
      background: 'var(--bg)', color: INK,
      padding: '9px 10px', fontSize: 11.5, fontWeight: 600, textAlign: 'right',
      borderBottom: '1px solid ' + LINE, fontStyle: 'italic',
      fontVariantNumeric: 'tabular-nums',
    };
  }

  function monthHeaderCellStyle(): React.CSSProperties {
    return {
      background: 'var(--surface)', color: INK,
      padding: '8px 10px', fontSize: 11, fontWeight: 700, textAlign: 'right',
      borderBottom: '1px solid ' + LINE, letterSpacing: '0.02em',
      fontVariantNumeric: 'tabular-nums', minWidth: 72,
    };
  }

  function grandTotalCellStyle(v: number): React.CSSProperties {
    return {
      background: '#1F2340', color: v < 0 ? '#FF9B96' : '#fff',
      padding: '12px 10px', fontSize: 12.5, fontWeight: 700, textAlign: 'right',
      borderTop: '2px solid #1F2340',
      fontVariantNumeric: 'tabular-nums',
    };
  }

  // ── Sub-components ─────────────────────────────────────────────────────────
  function GroupHeader({ group, label, totals, pal }: {
    group: keyof typeof groups; label: string;
    totals: ReturnType<typeof sumGroup>; pal: typeof PALETTES.income;
  }) {
    const open = groups[group];
    return (
      <tr>
        <td
          onClick={() => toggleGroup(group)}
          style={{
            position: 'sticky', left: 0, zIndex: 2,
            background: pal.headerBg, color: pal.header,
            padding: '11px 12px', fontWeight: 700, fontSize: 13,
            borderTop: '2px solid ' + LINE, borderBottom: '1px solid ' + LINE,
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={pal.header} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
            {label}
          </div>
        </td>
        {priorYears && <>
          <td style={headerCellStyle(pal)}>{fmt(totals.y2024)}</td>
          <td style={headerCellStyle(pal)}>{fmt(totals.y2025)}</td>
        </>}
        {monthsExpanded && MONTHS.map((m, mi) => (
          <td key={m} style={headerCellStyle(pal)}>{fmt(totals.monthly[mi])}</td>
        ))}
        <td style={{ ...headerCellStyle(pal), borderLeft: '2px solid ' + LINE }}>
          {fmt(totals.year)}
        </td>
      </tr>
    );
  }

  function EditableCell({ group, row, mi, pal }: {
    group: string; row: PlanRow; mi: number; pal: typeof PALETTES.income;
  }) {
    const value = getValue(group, row, mi);
    const k = cellKey(group, row.name, mi);
    const isEdited = k in edits;
    const isCurrent = mi === CURRENT_MONTH_IDX;

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); moveFocus(e.currentTarget, 0, 1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); moveFocus(e.currentTarget, 0, -1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(e.currentTarget, 0, 1); }
      else if (e.key === 'Escape')    { e.currentTarget.blur(); }
    };

    return (
      <td style={{
        ...cellStyle(pal),
        background: isCurrent ? '#FFFFFF' : pal.rowBg,
        padding: 0, position: 'relative',
      }}>
        {isEdited && (
          <div style={{
            position: 'absolute', top: 2, right: 2, width: 5, height: 5,
            borderRadius: 999, background: BRAND, pointerEvents: 'none',
          }} />
        )}
        <input
          type="text"
          inputMode="decimal"
          data-cell={group + '-' + mi}
          data-row={row.name}
          value={value === 0 ? '' : value.toLocaleString('en-US')}
          placeholder="–"
          onChange={(e) => {
            const raw = e.target.value.replace(/[,$\s]/g, '');
            const n = raw === '' ? 0 : Number(raw);
            if (!isNaN(n)) setValue(group, row.name, mi, n);
          }}
          onKeyDown={handleKey}
          onFocus={(e) => e.target.select()}
          style={{
            width: '100%', height: '100%', minHeight: 24,
            border: 'none', outline: 'none',
            padding: '5px 7px',
            background: 'transparent',
            color: isEdited ? BRAND : INK,
            fontSize: 11.5, fontWeight: isCurrent ? 600 : (isEdited ? 600 : 400),
            textAlign: 'right', fontFamily: 'inherit',
            fontVariantNumeric: 'tabular-nums',
            cursor: 'text',
          }}
        />
      </td>
    );
  }

  function Row({ row, pal, groupKey }: { row: PlanRow; pal: typeof PALETTES.income; groupKey: string }) {
    const yearSum = MONTHS.reduce((a, _m, mi) => a + getValue(groupKey, row, mi), 0);
    return (
      <tr>
        <td style={{
          position: 'sticky', left: 0, zIndex: 1,
          background: pal.rowBg, color: INK,
          padding: '5px 10px 5px 26px', fontSize: 11.5, fontWeight: 500,
          borderBottom: '1px solid ' + LINE,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: labelW, minWidth: labelW,
        }}>
          {row.name}
        </td>
        {priorYears && <>
          <td style={cellStyle(pal)}>{fmt(getActual(row.name, 'y2024', row.y2024))}</td>
          <td style={cellStyle(pal)}>{fmt(getActual(row.name, 'y2025', row.y2025))}</td>
        </>}
        {monthsExpanded && MONTHS.map((m, mi) => (
          <EditableCell key={m} group={groupKey} row={row} mi={mi} pal={pal} />
        ))}
        <td style={{ ...cellStyle(pal), borderLeft: '2px solid ' + LINE, fontWeight: 700, color: INK }}>
          {fmt(yearSum)}
        </td>
      </tr>
    );
  }

  function SubtotalRow({ label, totals, pal }: {
    label: string; totals: ReturnType<typeof sumGroup>; pal: typeof PALETTES.income;
  }) {
    return (
      <tr>
        <td style={{
          position: 'sticky', left: 0, zIndex: 1,
          background: pal.rowBg, color: pal.header,
          padding: '9px 12px', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
          borderTop: '1px solid ' + pal.header + '33', borderBottom: '2px solid ' + pal.header,
        }}>{label}</td>
        {priorYears && <>
          <td style={subtotalCellStyle(pal)}>{fmt(totals.y2024)}</td>
          <td style={subtotalCellStyle(pal)}>{fmt(totals.y2025)}</td>
        </>}
        {monthsExpanded && MONTHS.map((m, mi) => (
          <td key={m} style={subtotalCellStyle(pal)}>{fmt(totals.monthly[mi])}</td>
        ))}
        <td style={{ ...subtotalCellStyle(pal), borderLeft: '2px solid ' + LINE }}>
          {fmt(totals.year)}
        </td>
      </tr>
    );
  }

  function moveFocus(el: HTMLInputElement, _dx: number, dy: number) {
    const parts = el.dataset.cell?.split('-') ?? [];
    const group = parts[0];
    const mi    = Number(parts[1]);
    const rowName = el.dataset.row ?? '';
    const all = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-cell="' + group + '-' + mi + '"]'));
    const idx = all.findIndex(i => i.dataset.row === rowName);
    const target = all[idx + dy];
    if (target) target.focus();
  }

  // ── Toolbar dropdown ───────────────────────────────────────────────────────
  function YearDropdown() {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 500, color: INK,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>
        </svg>
        Year:&nbsp;
        <select value={selYear} onChange={e => setSelYear(e.target.value)}
          style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, color: INK, cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
          {['2024','2025','2026','2027','2028'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    );
  }

  function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: active ? BRAND_SOFT : 'var(--surface)',
        border: '1px solid ' + (active ? BRAND : LINE),
        color: active ? BRAND : INK,
        padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      }}>
        {children}
      </div>
    );
  }

  function ActionBtn({ disabled, primary, onClick, children }: {
    disabled?: boolean; primary?: boolean; onClick?: () => void; children: React.ReactNode;
  }) {
    return (
      <div onClick={disabled ? undefined : onClick} style={{
        padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: primary ? 600 : 500,
        background: primary ? (disabled ? 'var(--ink-muted)' : BRAND) : 'var(--surface)',
        color: primary ? '#fff' : (disabled ? 'var(--ink-muted)' : INK),
        border: primary ? 'none' : '1px solid ' + LINE,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}>
        {children}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiMini label={'Annual income · ' + selYear}   value={'$' + iTot.year.toLocaleString()} sub="Budgeted" color="var(--green)" />
        <KpiMini label={'Annual expenses · ' + selYear} value={'$' + eTot.year.toLocaleString()} sub="Budgeted" color="var(--red)" />
        <KpiMini label={'Annual savings · ' + selYear}  value={'$' + sTot.year.toLocaleString()} sub={((sTot.year/Math.max(iTot.year,1))*100).toFixed(1) + '% of income'} color="#4BA3F7" />
        <KpiMini label="To be allocated" value={'$' + toBeAllocatedYear.toLocaleString()} sub={toBeAllocatedYear >= 0 ? 'Surplus' : 'Deficit'} color={toBeAllocatedYear >= 0 ? 'var(--green)' : 'var(--red)'} />
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <YearDropdown />
          <ToggleBtn active={priorYears} onClick={() => setPriorYears(v => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {priorYears ? <path d="M5 13l4 4L19 7" /> : <rect x="4" y="4" width="16" height="16" rx="2" />}
            </svg>
            Show 2024 &amp; 2025
          </ToggleBtn>
          <ToggleBtn active={!monthsExpanded} onClick={() => setMonthsExpanded(v => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: monthsExpanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.15s' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
            {monthsExpanded ? 'Collapse ' + selYear : 'Expand ' + selYear}
          </ToggleBtn>
          <div style={{ width: 1, height: 20, background: LINE }} />
          <ActionBtn onClick={() => setGroups({ income: true, expenses: true, savings: true })}>Expand all</ActionBtn>
          <ActionBtn onClick={() => setGroups({ income: false, expenses: false, savings: false })}>Collapse all</ActionBtn>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {editCount > 0 && (
            <div style={{ fontSize: 11.5, color: BRAND, fontWeight: 600, marginRight: 4 }}>
              ● {editCount} unsaved change{editCount === 1 ? '' : 's'}
            </div>
          )}
          <ActionBtn disabled={editCount === 0} onClick={revertAll}>Revert</ActionBtn>
          <ActionBtn>Copy last year</ActionBtn>
          <ActionBtn primary disabled={editCount === 0 || isSaving} onClick={saveAll}>{isSaving ? 'Saving…' : 'Save changes'}</ActionBtn>
        </div>
      </div>

      {/* Spreadsheet table */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        <div style={{ overflow: 'auto', maxHeight: '72vh' }}>
          <table style={{
            borderCollapse: 'separate', borderSpacing: 0,
            fontSize: 12, fontVariantNumeric: 'tabular-nums',
            width: 'max-content', minWidth: '100%',
          }}>
            <thead>
              {/* Top header: section labels */}
              <tr style={{ position: 'sticky', top: 0, zIndex: 4 }}>
                <th style={{
                  position: 'sticky', left: 0, zIndex: 5,
                  background: '#1F2340', color: '#fff',
                  padding: '14px 14px', fontSize: 13, fontWeight: 700,
                  textAlign: 'left', letterSpacing: '0.02em',
                  borderRight: '1px solid ' + LINE, minWidth: labelW,
                }}>
                  Budget Planning
                  <div style={{ fontSize: 10, color: '#A8B0D0', fontWeight: 500, marginTop: 2 }}>Click cells to edit · Tab / Enter / ↑↓ to navigate</div>
                </th>
                {priorYears && (
                  <th colSpan={2} style={{
                    background: '#1F2340', color: '#fff',
                    padding: '14px 10px', fontSize: 12, fontWeight: 700,
                    textAlign: 'center', borderRight: '1px solid ' + LINE,
                  }}>Prior years</th>
                )}
                <th colSpan={monthsExpanded ? 13 : 1} style={{
                  background: '#1F2340', color: '#fff',
                  padding: '14px 10px', fontSize: 12, fontWeight: 700,
                  textAlign: 'center',
                }}>{selYear}{!monthsExpanded ? ' (collapsed)' : ''}</th>
              </tr>

              {/* "To be allocated" NET row */}
              <tr style={{ position: 'sticky', top: 53, zIndex: 4 }}>
                <th style={{
                  position: 'sticky', left: 0, zIndex: 5,
                  background: 'var(--bg)', color: 'var(--ink-soft)',
                  padding: '9px 14px', fontSize: 11, fontWeight: 600,
                  textAlign: 'left', fontStyle: 'italic',
                  borderBottom: '1px solid ' + LINE, minWidth: labelW,
                }}>To be allocated</th>
                {priorYears && <>
                  <th style={totalsHeaderCellStyle()}>{fmt(toBeAllocatedY24)}</th>
                  <th style={totalsHeaderCellStyle()}>{fmt(toBeAllocatedY25)}</th>
                </>}
                {monthsExpanded && MONTHS.map((m, mi) => (
                  <th key={m} style={{
                    ...totalsHeaderCellStyle(),
                    color: toBeAllocated[mi] < 0 ? 'var(--red)' : INK,
                    fontWeight: 700,
                  }}>
                    {toBeAllocated[mi] < 0
                      ? '(' + Math.abs(toBeAllocated[mi]).toLocaleString() + ')'
                      : fmt(toBeAllocated[mi])}
                  </th>
                ))}
                <th style={{ ...totalsHeaderCellStyle(), borderLeft: '2px solid ' + LINE, fontWeight: 700 }}>
                  {fmt(toBeAllocatedYear)}
                </th>
              </tr>

              {/* Month column labels */}
              <tr style={{ position: 'sticky', top: 88, zIndex: 4 }}>
                <th style={{
                  position: 'sticky', left: 0, zIndex: 5,
                  background: 'var(--surface)', color: 'var(--ink-muted)',
                  padding: '8px 14px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
                  textAlign: 'left', borderBottom: '1px solid ' + LINE, minWidth: labelW,
                }}>CATEGORY</th>
                {priorYears && <>
                  <th style={monthHeaderCellStyle()}>2024<br/><span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>Total</span></th>
                  <th style={monthHeaderCellStyle()}>2025<br/><span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>Total</span></th>
                </>}
                {monthsExpanded && MONTHS.map((m, mi) => (
                  <th key={m} style={{
                    ...monthHeaderCellStyle(),
                    color: mi === CURRENT_MONTH_IDX ? BRAND : INK,
                    background: mi === CURRENT_MONTH_IDX ? BRAND_SOFT : 'var(--surface)',
                  }}>{m}</th>
                ))}
                <th style={{ ...monthHeaderCellStyle(), borderLeft: '2px solid ' + LINE }}>
                  {selYear}<br/><span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INCOME */}
              <GroupHeader group="income" label="Income" totals={iTot} pal={PALETTES.income} />
              {groups.income && PLANNING_DATA.income.map(r => (
                <Row key={r.name} row={r} pal={PALETTES.income} groupKey="income" />
              ))}
              {groups.income && <SubtotalRow label="Income subtotal" totals={iTot} pal={PALETTES.income} />}

              {/* EXPENSES */}
              <GroupHeader group="expenses" label="Expenses" totals={eTot} pal={PALETTES.expenses} />
              {groups.expenses && PLANNING_DATA.expenses.map(r => (
                <Row key={r.name} row={r} pal={PALETTES.expenses} groupKey="expenses" />
              ))}
              {groups.expenses && <SubtotalRow label="Expenses subtotal" totals={eTot} pal={PALETTES.expenses} />}

              {/* SAVINGS */}
              <GroupHeader group="savings" label="Savings" totals={sTot} pal={PALETTES.savings} />
              {groups.savings && PLANNING_DATA.savings.map(r => (
                <Row key={r.name} row={r} pal={PALETTES.savings} groupKey="savings" />
              ))}
              {groups.savings && <SubtotalRow label="Savings subtotal" totals={sTot} pal={PALETTES.savings} />}

              {/* GRAND TOTAL / NET row */}
              <tr>
                <td style={{
                  position: 'sticky', left: 0, zIndex: 1,
                  background: '#1F2340', color: '#fff',
                  padding: '12px 14px', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
                  borderTop: '2px solid #1F2340',
                }}>NET (Income − Expenses − Savings)</td>
                {priorYears && <>
                  <td style={grandTotalCellStyle(toBeAllocatedY24)}>{fmt(toBeAllocatedY24)}</td>
                  <td style={grandTotalCellStyle(toBeAllocatedY25)}>{fmt(toBeAllocatedY25)}</td>
                </>}
                {monthsExpanded && MONTHS.map((m, mi) => (
                  <td key={m} style={grandTotalCellStyle(toBeAllocated[mi])}>
                    {toBeAllocated[mi] < 0
                      ? '(' + Math.abs(toBeAllocated[mi]).toLocaleString() + ')'
                      : fmt(toBeAllocated[mi])}
                  </td>
                ))}
                <td style={{ ...grandTotalCellStyle(toBeAllocatedYear), borderLeft: '2px solid #1F2340' }}>
                  {fmt(toBeAllocatedYear)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', padding: '0 4px' }}>
        <b style={{ color: INK }}>Tip:</b> Click any cell to edit · <b>Tab</b> moves right · <b>Enter / ↓</b> moves down · <b>↑</b> moves up · <b>Esc</b> exits. Purple dot = unsaved edit. Subtotals and NET update live.
      </div>
    </div>
  );
}
