import { useState } from 'react';

interface Segment { value: number; color: string; label?: string; }

interface DonutProps {
  data: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  interactive?: boolean;
  bg?: string; // kept for backward compat
}

export function Donut({
  data, size = 150, thickness = 22,
  centerLabel, centerValue, interactive = true,
}: DonutProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const r = size / 2;
  const innerR = r - thickness;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let angle = -90;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...d, i, start, end, sweep };
  });

  function arcPath(start: number, end: number, outer: number, inner: number) {
    const largeArc = end - start > 180 ? 1 : 0;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const p1 = [r + outer * Math.cos(toRad(start)), r + outer * Math.sin(toRad(start))];
    const p2 = [r + outer * Math.cos(toRad(end)),   r + outer * Math.sin(toRad(end))];
    const p3 = [r + inner * Math.cos(toRad(end)),   r + inner * Math.sin(toRad(end))];
    const p4 = [r + inner * Math.cos(toRad(start)), r + inner * Math.sin(toRad(start))];
    return 'M ' + p1[0] + ' ' + p1[1] + ' A ' + outer + ' ' + outer + ' 0 ' + largeArc + ' 1 ' + p2[0] + ' ' + p2[1] + ' L ' + p3[0] + ' ' + p3[1] + ' A ' + inner + ' ' + inner + ' 0 ' + largeArc + ' 0 ' + p4[0] + ' ' + p4[1] + ' Z';
  }

  const hovered = hoverIdx != null ? slices[hoverIdx] : null;
  const hoveredPct = hovered ? (hovered.value / total) * 100 : 0;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={arcPath(s.start, s.end, r, innerR)}
            fill={s.color}
            opacity={!interactive || hoverIdx == null || hoverIdx === i ? 1 : 0.35}
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'opacity 0.12s' }}
            onMouseEnter={() => interactive && setHoverIdx(i)}
            onMouseLeave={() => interactive && setHoverIdx(null)}
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        {(hovered && interactive) ? (
          <>
            <div style={{
              fontSize: 9.5, color: 'var(--ink-muted)', fontWeight: 500,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              marginBottom: 2, padding: '0 8px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: (innerR * 2 - 8) + 'px',
            }}>{hovered.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
              {hoveredPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
              {'$' + hovered.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </>
        ) : (
          <>
            {centerLabel && (
              <div style={{
                fontSize: size * 0.065, color: 'var(--ink-muted)', fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2,
              }}>{centerLabel}</div>
            )}
            {centerValue && (
              <div style={{ fontSize: size * 0.16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {centerValue}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
