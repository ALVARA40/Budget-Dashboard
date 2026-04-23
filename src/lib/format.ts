// Number and date formatters

export function fmt$(value: number, opts: { cents?: boolean; compact?: boolean } = {}): string {
  const { cents = false, compact = false } = opts;
  if (compact && Math.abs(value) >= 1000) {
    return '$' + (value / 1000).toFixed(Math.abs(value) < 10000 ? 1 : 0) + 'k';
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export function fmtPct(value: number, digits = 1): string {
  return value.toFixed(digits) + '%';
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00'); // avoid UTC offset issues
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
