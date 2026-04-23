import type { FlowMonth } from '../../types';
import { fmt$ } from '../../lib/format';

interface Props {
  data: FlowMonth[];
  height?: number;
  highlightIdx?: number;
}

export function MoneyFlowChart({ data, height = 210, highlightIdx }: Props) {
  // Auto-pick peak income month if not specified
  let peakIdx = highlightIdx;
  if (peakIdx == null) {
    let peak = 0;
    data.forEach((f, i) => { if (f.income > peak) { peak = f.income; peakIdx = i; } });
  }

  const max = Math.max(...data.flatMap(d => [d.income, d.expenses]));
  const step = 5000;
  const niceMax = Math.ceil(max / step) * step + step;
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));
  const plotH = height - 36;

  return (
    <div style={{ position: 'relative', paddingTop: 32 }}>
      <div style={{ display: 'flex', height: plotH, position: 'relative' }}>
        {/* Y-axis */}
        <div style={{
          width: 56, display: 'flex', flexDirection: 'column-reverse',
          justifyContent: 'space-between', paddingRight: 8,
        }}>
          {ticks.map((t, i) => (
            <div key={i} style={{
              fontSize: 10.5, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums',
              textAlign: 'right', lineHeight: 1, transform: 'translateY(50%)',
            }}>
              {i === 0 ? '' : '$' + t.toLocaleString('en-US')}
            </div>
          ))}
        </div>

        {/* Plot area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Grid lines */}
          {ticks.map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0,
              top: `${(1 - i / tickCount) * 100}%`,
              height: 1, background: 'var(--line)', opacity: 0.8,
            }} />
          ))}

          {/* Bars */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
            {data.map((d, i) => (
              <div key={i} style={{
                flex: 1, height: '100%',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                gap: 4, position: 'relative',
              }}>
                <div style={{
                  width: 16,
                  height: `${(d.income / niceMax) * 100}%`,
                  background: 'var(--brand)',
                  borderRadius: '10px 10px 4px 4px',
                }} />
                <div style={{
                  width: 16,
                  height: `${(d.expenses / niceMax) * 100}%`,
                  background: 'var(--expense-bar)',
                  borderRadius: '10px 10px 4px 4px',
                }} />

                {/* Tooltip on peak bar */}
                {i === peakIdx && (
                  <div style={{
                    position: 'absolute',
                    bottom: `${(d.income / niceMax) * 100}%`,
                    left: '50%', transform: 'translate(-50%, -14px)',
                    background: 'var(--surface)', color: 'var(--ink)',
                    padding: '7px 14px', borderRadius: 999,
                    fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 10px 22px -8px rgba(15,14,26,0.18)',
                    border: '1px solid var(--line)',
                    pointerEvents: 'none',
                  }}>
                    {fmt$(d.income)}
                    <div style={{
                      position: 'absolute', left: '50%', top: '100%',
                      transform: 'translate(-50%, 3px)',
                      width: 6, height: 6, borderRadius: 999,
                      background: 'var(--brand)',
                      boxShadow: '0 0 0 3px var(--surface)',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', marginTop: 10, paddingLeft: 56 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500,
          }}>{d.m}</div>
        ))}
      </div>
    </div>
  );
}
