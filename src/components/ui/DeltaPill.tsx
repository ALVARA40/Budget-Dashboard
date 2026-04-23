interface Props {
  value: number;
  goodOnUp?: boolean;
}

export function DeltaPill({ value, goodOnUp = true }: Props) {
  const up = value > 0;
  const isGood = goodOnUp ? up : !up;
  const bg = isGood ? 'rgba(51,197,138,0.15)' : 'rgba(242,95,92,0.14)';
  const fg = isGood ? '#1E9968' : '#D8443F';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: bg, color: fg,
      padding: '3px 7px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 9 }}>{up ? '▲' : '▼'}</span>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
