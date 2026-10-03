import { useState } from 'react';
import { Empty, PageHeader, Stat } from '../components/common';
import { useData } from '../data';
import { reportRows, totalsOf } from '../lib/calc';
import { fmtBoxes, fmtDate, inr, todayStr } from '../lib/format';

type Period = 'month' | 'last' | '30' | 'year' | 'all' | 'custom';

const PERIODS: Array<[Period, string]> = [
  ['month', 'This month'],
  ['last', 'Last month'],
  ['30', 'Last 30 days'],
  ['year', 'This year'],
  ['all', 'All time'],
  ['custom', 'Custom'],
];

const pad = (n: number) => String(n).padStart(2, '0');
const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function rangeOf(p: Period, today: string, from: string, to: string): [string, string] {
  const [y, m] = today.split('-').map(Number);
  if (p === 'month') return [dstr(new Date(y, m - 1, 1)), dstr(new Date(y, m, 0))];
  if (p === 'last') return [dstr(new Date(y, m - 2, 1)), dstr(new Date(y, m - 1, 0))];
  if (p === '30') return [dstr(new Date(y, m - 1, Number(today.slice(8)) - 29)), today];
  if (p === 'year') return [`${y}-01-01`, `${y}-12-31`];
  if (p === 'custom') return [from || '0000-01-01', to || '9999-12-31'];
  return ['0000-01-01', '9999-12-31'];
}

function monthName(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function Reports() {
  const { sales, expenses, suppliers, piecesPerBox } = useData();
  const today = todayStr();
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today);
  const [supplier, setSupplier] = useState('');

  const [a, b] = rangeOf(period, today, from, to);
  const inRange = (d: string) => d >= a && d <= b;
  const sid = supplier ? Number(supplier) : null;
  const rs = sales.filter((s) => inRange(s.date) && (sid === null || s.supplierId === sid));
  // Expenses are not tied to a supplier, so they only count when no supplier is picked
  const re = sid === null ? expenses.filter((e) => inRange(e.date)) : [];
  const t = totalsOf(rs, re, piecesPerBox);
  const useBoxes = piecesPerBox > 1;

  const spanMonths = period === 'all' || period === 'year' || (period === 'custom' && b.slice(0, 7) !== a.slice(0, 7) && (!from || !to || to.slice(0, 7) !== from.slice(0, 7)));
  const rows = reportRows(rs, re, piecesPerBox, spanMonths);

  const bySupplier =
    sid === null
      ? suppliers
          .map((s) => ({ s, t: totalsOf(rs.filter((x) => x.supplierId === s.id), [], piecesPerBox) }))
          .filter((x) => x.t.sales > 0)
          .sort((x, y) => y.t.sales - x.t.sales)
      : [];

  return (
    <div>
      <PageHeader title="Reports">
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {PERIODS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`h-10 shrink-0 rounded-full px-4 text-[15px] font-medium transition-colors ${period === key ? 'bg-cocoa text-white' : 'border border-line bg-white text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="space-y-4 px-4 pb-4">
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block px-1 text-sm text-muted">From</span>
              <input type="date" className="field appearance-none" value={from} max="9999-12-31" onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block px-1 text-sm text-muted">To</span>
              <input type="date" className="field appearance-none" value={to} max="9999-12-31" onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        )}

        <select className="field appearance-none" value={supplier} onChange={(e) => setSupplier(e.target.value)} aria-label="Supplier">
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {period !== 'all' && (
          <p className="px-1 text-sm text-muted">
            {period === 'custom' && (!from || !to) ? 'Pick both dates' : `${fmtDate(a)} – ${fmtDate(b)}`}
          </p>
        )}

        {rs.length === 0 && re.length === 0 ? (
          <Empty title="Nothing in this period" body="Try another period or supplier." />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Stat label="Total sales" value={inr(t.sales)} />
              {sid === null ? <Stat label="Total expenses" value={inr(t.expenses)} /> : <Stat label="Received" value={inr(t.received)} tone="ok" />}
              {sid === null ? <Stat label="Profit" value={inr(t.profit)} tone={t.profit < 0 ? 'bad' : 'ok'} /> : <Stat label="Pending" value={inr(t.pending)} tone={t.pending > 0 ? 'bad' : 'ok'} />}
              <Stat label="Boxes sold" value={useBoxes ? fmtBoxes(t.boxes) : `${t.pieces} pcs`} />
              {sid === null && <Stat label="Received" value={inr(t.received)} tone="ok" />}
              {sid === null && <Stat label="Pending" value={inr(t.pending)} tone={t.pending > 0 ? 'bad' : 'ok'} />}
            </section>
            {sid !== null && <p className="px-1 text-sm text-muted">Expenses and profit are shown for all suppliers together, so they are hidden here.</p>}

            <section>
              <h2 className="mb-2 px-1 text-base font-semibold">{spanMonths ? 'Month by month' : 'Day by day'}</h2>
              <div className="card divide-y divide-line overflow-hidden">
                {rows.map((r) => (
                  <div key={r.key} className="px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] font-semibold">{spanMonths ? monthName(r.key) : fmtDate(r.key)}</span>
                      {sid === null && <span className={`num text-[15px] font-bold ${r.profit < 0 ? 'text-bad' : 'text-ok'}`}>{inr(r.profit)}</span>}
                    </div>
                    <div className="num mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
                      <span>Sales {inr(r.sales)}</span>
                      {sid === null && <span>Exp {inr(r.expenses)}</span>}
                      {useBoxes && <span>{fmtBoxes(r.boxes)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {bySupplier.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-base font-semibold">By supplier</h2>
                <div className="card divide-y divide-line overflow-hidden">
                  {bySupplier.map(({ s, t: st }) => (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[15px] font-semibold">{s.name}</span>
                        <span className="num text-[15px] font-bold">{inr(st.sales)}</span>
                      </div>
                      <div className="num mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
                        {useBoxes && <span>{fmtBoxes(st.boxes)}</span>}
                        <span>Received {inr(st.received)}</span>
                        <span className={st.pending > 0 ? 'text-bad' : ''}>Pending {inr(st.pending)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
