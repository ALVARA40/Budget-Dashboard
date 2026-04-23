export type IconName =
  | 'dashboard' | 'planning' | 'tracking' | 'split' | 'analytics'
  | 'settings' | 'search' | 'plus' | 'chev' | 'bell'
  | 'arrowup' | 'arrowdown' | 'dots' | 'wallet' | 'filter'
  | 'calendar' | 'close' | 'check' | 'edit' | 'trash';

interface Props {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
}

export function Icon({ name, size = 18, stroke = 'currentColor', sw = 1.8 }: Props) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    planning:  <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>,
    tracking:  <><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></>,
    split:     <><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/></>,
    analytics: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    search:    <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    chev:      <><path d="M9 18l6-6-6-6"/></>,
    bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    arrowup:   <><path d="M7 17L17 7M7 7h10v10"/></>,
    arrowdown: <><path d="M17 7L7 17M17 17H7V7"/></>,
    dots:      <><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></>,
    wallet:    <><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 13h2M2 10h20"/></>,
    filter:    <><path d="M3 5h18M6 12h12M10 19h4"/></>,
    calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    close:     <><path d="M18 6L6 18M6 6l12 12"/></>,
    check:     <><path d="M20 6L9 17l-5-5"/></>,
    edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:     <><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></>,
  };

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
