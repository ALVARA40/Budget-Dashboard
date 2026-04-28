import { useState } from 'react';

interface SparklineProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  formatValue?: (v: number) => string;
}

export function Sparkline({
  data, labels, width = 280, height = 60,
  stroke = '#7C5CFC', fill = 'rgba(124,92,252,0.12)',
  formatValue,
}: SparklineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => [
    pad + i * stepX,
    pad + (1 - (v - min) / range) * (height - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]} ${height - pad} L ${pts[0][0]} ${height - pad} Z`;

  const hovered = hoverIdx != null ? data[hoverIdx] : null;
  const hoveredPt = hoverIdx != null ? pts[hoverIdx] : null;
  const hoveredLabel = hoverIdx != null && labels ? labels[hoverIdx] : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={width} height={height}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ display: 'block' }}
      >
        <path d={area} fill={fill} />
        <path d={line} stroke={stroke} strokeWidth="2" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Invisible hover zones */}
        {pts.map((p, i) => (
          <rect
            key={i}
            x={i === 0 ? 0 : (pts[i-1][0] + p[0]) / 2}
            y={0}
            width={
              i === pts.length - 1
                ? width - (i === 0 ? 0 : (pts[i-1][0] + p[0]) / 2)
                : ((pts[i+1][0] + p[0]) / 2) - (i === 0 ? 0 : (pts[i-1][0] + p[0]) / 2)
            }
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}

        {/* Active dot */}
        {hoveredPt && (
          <>
            <line
              x1={hoveredPt[0]} y1={0}
              x2={hoveredPt[0]} y2={height}
              stroke={stroke} strokeWidth={1} strokeDasharray="3 2" opacity={0.4}
            />
            <circle cx={hoveredPt[0]} cy={hoveredPt[1]} r={4} fill={stroke} />
          </>
        )}

        {/* Always show last dot when not hovering */}
        {hoverIdx == null && pts.map((p, i) => i === pts.length - 1 ? (
          <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={stroke} />
        ) : null)}
      </svg>

      {/* Tooltip */}
      {hoveredPt && hovered != null && (
        <div style={{
          position: 'absolute',
          bottom: height - hoveredPt[1] + 8,
          left: Math.min(Math.max(hoveredPt[0] - 40, 0), width - 80),
          background: 'var(--ink)', color: '#fff',
          padding: '5px 10px', borderRadius: 8,
          fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 10,
          boxShadow: '0 6px 16px -6px rgba(15,14,26,0.4)',
        }}>
          {hoveredLabel && (
            <span style={{ color: '#BFB6F5', marginRight: 6, fontSize: 10 }}>{hoveredLabel}</span>
          )}
          {formatValue ? formatValue(hovered) : hovered.toFixed(1)}
        </div>
      )}
    </div>
  );
}
