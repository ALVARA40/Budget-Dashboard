interface Props {
  pct: number;
  color?: string;
  track?: string;
  height?: number;
}

export function ProgressBar({ pct, color = 'var(--brand)', track = 'var(--bg)', height = 8 }: Props) {
  return (
    <div style={{ width: '100%', height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        height: '100%',
        background: color,
        borderRadius: 999,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}
