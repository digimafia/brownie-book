import type { ReactNode } from 'react';
import { Plus, Settings as Cog } from 'lucide-react';
import { WeeklyChart } from '../components/Chart';
import { PageHeader, Stat } from '../components/common';
import { ExpenseRow, SaleRow } from '../components/Rows';
import { useData } from '../data';
import { summarize, totalsOf, weekBuckets } from '../lib/calc';
import { fmtBoxes, inr, monthLabel, todayStr } from '../lib/format';
import { useUI } from '../ui';

export function Dashboard() {
  const { sales, expenses, piecesPerBox } = useData();
  const { open, setTab } = useUI();
  const today = todayStr();
  const all = totalsOf(sales, expenses, piecesPerBox);
  const s = summarize(sales, expenses, today);
  const weeks = weekBuckets(sales, expenses, today);

  return (
    <div>
      <PageHeader
        title="Brownie Book"
        right={
          <button onClick={() => open({ t: 'settings' })} aria-label="Backup" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-cocoa active:bg-line/60">
            <Cog size={23} />
          </button>
        }
      />

      <div className="space-y-4 px-4 pb-4">
        <section className="rounded-[28px] bg-cocoa p-5 text-white shadow-card">
          <div className="text-sm text-white/65">Today</div>
          <div className="mt-1 grid grid-cols-3 gap-3">
            <Today label="Sales" value={inr(s.todaySales)} />
            <Today label="Expenses" value={inr(s.todayExpenses)} />
            <Today label="Profit" value={inr(s.todayProfit)} accent />
          </div>
        </section>

        <section>
          <div className="mb-2 px-1 text-sm font-medium text-muted">{monthLabel(today)}</div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total sales" value={inr(s.monthSales)} />
            <Stat label="Total expenses" value={inr(s.monthExpenses)} />
            <Stat label="Profit" value={inr(s.monthProfit)} tone={s.monthProfit < 0 ? 'bad' : 'ok'} />
            <Stat label="Pending payment" value={inr(s.monthPending)} tone={s.monthPending > 0 ? 'bad' : 'default'} />
          </div>
          {s.olderPending > 0 && <p className="num mt-2 px-1 text-sm text-muted">Plus {inr(s.olderPending)} still unpaid from earlier months.</p>}
        </section>

        <section>
          <div className="mb-2 px-1 text-sm font-medium text-muted">All time (till date)</div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total sales" value={inr(all.sales)} />
            <Stat label="Total expenses" value={inr(all.expenses)} />
            <Stat label="Total profit" value={inr(all.profit)} tone={all.profit < 0 ? 'bad' : 'ok'} />
            <Stat label="Received" value={inr(all.received)} tone="ok" />
            <Stat label="Pending payment" value={inr(all.pending)} tone={all.pending > 0 ? 'bad' : 'default'} />
            <Stat label="Boxes sold" value={piecesPerBox > 1 ? fmtBoxes(all.boxes) : `${all.pieces} pcs`} />
          </div>
          {piecesPerBox > 1 && <p className="num mt-2 px-1 text-sm text-muted">{all.pieces} pcs sold in total.</p>}
        </section>

        <section className="card px-4 pb-4 pt-4">
          <div className="mb-2 text-base font-semibold">Sales vs expenses</div>
          <WeeklyChart data={weeks} />
        </section>

        <Block title="Recent sales" onMore={sales.length > 5 ? () => setTab('sales') : undefined} empty={sales.length === 0 ? 'No sales yet. Tap + to add the first one.' : ''}>
          {sales.slice(0, 5).map((x) => (
            <SaleRow key={x.id} sale={x} onClick={() => open({ t: 'saleDetail', id: x.id })} />
          ))}
        </Block>

        <Block title="Recent expenses" onMore={expenses.length > 5 ? () => setTab('expenses') : undefined} empty={expenses.length === 0 ? 'No expenses yet.' : ''}>
          {expenses.slice(0, 5).map((x) => (
            <ExpenseRow key={x.id} expense={x} onClick={() => open({ t: 'expense', id: x.id })} />
          ))}
        </Block>
      </div>
    </div>
  );
}

function Today({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] text-white/65">{label}</div>
      <div className={`num truncate text-[21px] font-bold leading-tight ${accent ? 'text-[#F2C27A]' : ''}`}>{value}</div>
    </div>
  );
}

function Block({ title, onMore, empty, children }: { title: string; onMore?: () => void; empty: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {onMore && (
          <button onClick={onMore} className="h-9 text-sm font-semibold text-cocoa">
            See all
          </button>
        )}
      </div>
      <div className="card divide-y divide-line overflow-hidden">{empty ? <p className="px-4 py-6 text-center text-sm text-muted">{empty}</p> : children}</div>
    </section>
  );
}

export function AddMenuButtons() {
  const { open } = useUI();
  return (
    <div className="space-y-3 pt-1">
      <button className="btn-primary" onClick={() => open({ t: 'sale' })}>
        <Plus size={20} /> Add sale
      </button>
      <button className="btn-quiet" onClick={() => open({ t: 'expense' })}>
        <Plus size={20} /> Add expense
      </button>
      <button className="btn-quiet" onClick={() => open({ t: 'payment' })}>
        <Plus size={20} /> Receive payment
      </button>
    </div>
  );
}
