interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}

export function Sparkline({
  data, width = 280, height = 60,
  stroke = '#7C5CFC', fill = 'rgba(124,92,252,0.12)',
}: SparklineProps) {
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

  return (
    <svg width={width} height={height}>
      <path d={area} fill={fill} />
      <path d={line} stroke={stroke} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 ? (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={stroke} />
      ) : null)}
    </svg>
  );
}
