import { useState } from 'react';
import type { FlowMonth } from '../../types';

interface Props {
  data: FlowMonth[];
  height?: number;
}

export function MoneyFlowChart({ data, height = 210 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const max = Math.max(...data.flatMap(d => [d.income, d.expenses]));
  const step = 5000;
  const niceMax = Math.ceil(max / step) * step + step;
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));
  const plotH = height - 36;

  const tickLabel = (v: number) => '$' + v.toLocaleString('en-US');

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
              {i === 0 ? '' : tickLabel(t)}
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
            {data.map((d, i) => {
              const active = hoverIdx === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  style={{
                    flex: 1, height: '100%',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    gap: 4, position: 'relative', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 16,
                    height: `${(d.income / niceMax) * 100}%`,
                    background: 'var(--brand)',
                    borderRadius: '10px 10px 4px 4px',
                    opacity: hoverIdx == null || active ? 1 : 0.45,
                    transition: 'opacity 0.12s',
                  }} />
                  <div style={{
                    width: 16,
                    height: `${(d.expenses / niceMax) * 100}%`,
                    background: 'var(--expense-bar)',
                    borderRadius: '10px 10px 4px 4px',
                    opacity: hoverIdx == null || active ? 1 : 0.45,
                    transition: 'opacity 0.12s',
                  }} />

                  {/* Hover tooltip */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      bottom: `${(Math.max(d.income, d.expenses) / niceMax) * 100}%`,
                      left: '50%', transform: 'translate(-50%, -10px)',
                      background: 'var(--ink)', color: '#fff',
                      padding: '8px 12px', borderRadius: 10,
                      fontSize: 11.5, fontWeight: 500,
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                      boxShadow: '0 10px 22px -8px rgba(15,14,26,0.35)',
                      zIndex: 10,
                    }}>
                      <div style={{ fontSize: 9.5, color: '#BFB6F5', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{d.m}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: 'var(--brand)' }} />
                          Income: {tickLabel(d.income)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: 'var(--expense-bar)' }} />
                          Expenses: {tickLabel(d.expenses)}
                        </span>
                      </div>
                      <div style={{
                        position: 'absolute', left: '50%', top: '100%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid var(--ink)',
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', marginTop: 10, paddingLeft: 56 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 11.5,
            color: hoverIdx === i ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: hoverIdx === i ? 700 : 500,
          }}>{d.m}</div>
        ))}
      </div>
    </div>
  );
}
