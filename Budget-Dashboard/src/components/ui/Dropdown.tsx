import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  width?: string | number;
  icon?: React.ReactNode;
}

export function Dropdown({ label, value, options, onChange, width = 'auto', icon }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: open ? 'var(--brand-soft)' : 'var(--surface)',
          border: `1px solid ${open ? 'var(--brand)' : 'var(--line)'}`,
          borderRadius: 999, padding: '7px 14px',
          fontSize: 12.5, fontWeight: 500, color: 'var(--ink)',
          cursor: 'pointer', userSelect: 'none' as const,
          width, whiteSpace: 'nowrap' as const,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {icon && (
          <span style={{ color: open ? 'var(--brand)' : 'var(--ink-soft)', display: 'flex' }}>
            {icon}
          </span>
        )}
        {label && <span style={{ color: 'var(--ink-soft)' }}>{label}</span>}
        <span style={{ flex: 1 }}>{value}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={open ? 'var(--brand)' : 'var(--ink-muted)'}
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
          boxShadow: '0 14px 30px -8px rgba(15,14,26,0.18)',
          padding: 6, minWidth: 200, maxHeight: 320, overflowY: 'auto' as const,
        }}>
          {options.map(opt => {
            const active = opt === value;
            return (
              <DropdownItem
                key={opt}
                label={opt}
                active={active}
                onClick={() => { onChange(opt); setOpen(false); }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 12px', borderRadius: 8,
        fontSize: 12.5,
        color: active ? 'var(--brand)' : 'var(--ink)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        background: active ? 'var(--brand-soft)' : hovered ? 'var(--bg)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <span>{label}</span>
      {active && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--brand)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}
