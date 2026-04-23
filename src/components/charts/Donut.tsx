interface Segment { value: number; color: string; label?: string; }

interface DonutProps {
  data: Segment[];
  size?: number;
  thickness?: number;
  gap?: number;
  centerLabel?: string;
  centerValue?: string;
  bg?: string;
}

export function Donut({
  data, size = 220, thickness = 36, gap = 2,
  centerLabel, centerValue, bg = 'transparent',
}: DonutProps) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  let acc = 0;
  const segs = data.map((d) => {
    const frac = d.value / total;
    const len = frac * circ;
    const dashLen = Math.max(0, len - gap);
    const dash = `${dashLen} ${circ - dashLen}`;
    const offset = -acc;
    acc += len;
    return { ...d, dash, offset };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={bg} strokeWidth={thickness} />
      {segs.map((s, i) => (
        <circle
          key={i} cx={c} cy={c} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={s.dash}
          strokeDashoffset={s.offset}
          transform={`rotate(-90 ${c} ${c})`}
          strokeLinecap="butt"
        />
      ))}
      {(centerLabel || centerValue) && (
        <g>
          {centerValue && (
            <text x={c} y={c - 2} textAnchor="middle"
              fontSize={size * 0.16} fontWeight="700" fill="currentColor">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={c} y={c + size * 0.11} textAnchor="middle"
              fontSize={size * 0.06} fontWeight="500" fill="currentColor" opacity="0.55"
              style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
