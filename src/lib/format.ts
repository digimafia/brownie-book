const pad = (n: number) => String(n).padStart(2, '0');

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Indian grouping: ₹1,25,000 */
export function inr(n: number): string {
  const v = round2(Math.abs(n));
  const s = v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${n < 0 && v !== 0 ? '-' : ''}₹${s}`;
}

export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const sameYear = y === new Date().getFullYear();
  return dt.toLocaleDateString('en-IN', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function monthLabel(today: string = todayStr()): string {
  const [y, m] = today.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** Keep only digits and a single decimal point */
export function cleanNumber(s: string): string {
  const t = s.replace(/[^0-9.]/g, '');
  const i = t.indexOf('.');
  return i === -1 ? t : t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
}

export function num(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function fmtBoxes(n: number): string {
  const v = round2(n);
  return `${v} ${v === 1 ? 'box' : 'boxes'}`;
}
