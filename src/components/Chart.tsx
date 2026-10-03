import type { WeekBucket } from '../lib/calc';
import { inr } from '../lib/format';

export function WeeklyChart({ data }: { data: WeekBucket[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.sales, d.expenses]));
  const W = 320;
  const H = 150;
  const base = H - 22;
  const top = 10;
  const group = W / data.length;
  const bw = 20;
  const h = (v: number) => (v <= 0 ? 0 : Math.max(3, (v / max) * (base - top)));
  const empty = data.every((d) => d.sales === 0 && d.expenses === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Sales and expenses by week this month">
        <line x1="0" x2={W} y1={base} y2={base} stroke="#E7E0DA" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = group * i + group / 2;
          return (
            <g key={d.label}>
              <rect x={cx - bw - 2} y={base - h(d.sales)} width={bw} height={h(d.sales)} rx="5" fill="#3A2217" />
              <rect x={cx + 2} y={base - h(d.expenses)} width={bw} height={h(d.expenses)} rx="5" fill="#C98A3D" />
              <text x={cx} y={H - 5} textAnchor="middle" fontSize="11" fill="#7A6A60">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {empty && <p className="-mt-1 pb-1 text-center text-sm text-muted">Nothing recorded this month yet.</p>}
      <div className="mt-2 flex items-center gap-5 px-1 text-sm text-muted">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-sm bg-cocoa" /> Sales
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-sm bg-caramel" /> Expenses
        </span>
        <span className="num ml-auto text-xs">Peak {inr(max === 1 && empty ? 0 : max)}</span>
      </div>
    </div>
  );
}
