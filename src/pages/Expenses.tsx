import { Empty, PageHeader } from '../components/common';
import { ExpenseRow } from '../components/Rows';
import { useData } from '../data';
import { monthLabel, inr, todayStr, round2 } from '../lib/format';
import { useUI } from '../ui';

export function Expenses() {
  const { expenses } = useData();
  const { open } = useUI();
  const today = todayStr();
  const mk = today.slice(0, 7);
  const monthTotal = round2(expenses.filter((e) => e.date.startsWith(mk)).reduce((a, e) => a + e.amount, 0));

  return (
    <div>
      <PageHeader title="Expenses" />
      <div className="space-y-4 px-4 pb-4">
        <div className="card px-5 py-4">
          <div className="text-sm text-muted">{monthLabel(today)}</div>
          <div className="num text-[30px] font-bold leading-tight">{inr(monthTotal)}</div>
          <div className="text-sm text-muted">spent this month</div>
        </div>
        {expenses.length === 0 ? (
          <Empty title="No expenses yet" body="Tap + to record ingredients, packaging and other costs." />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {expenses.map((e) => (
              <ExpenseRow key={e.id} expense={e} onClick={() => open({ t: 'expense', id: e.id })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
