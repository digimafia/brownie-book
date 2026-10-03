import { Receipt } from 'lucide-react';
import { fmtDate, inr } from '../lib/format';
import type { Expense, SaleView } from '../types';
import { StatusBadge } from './common';

export function SaleRow({ sale, onClick }: { sale: SaleView; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-paper">
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{sale.supplierName}</div>
        <div className="num mt-0.5 text-sm text-muted">
          {fmtDate(sale.date)} · {sale.quantity} pcs
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="num text-base font-bold">{inr(sale.total)}</span>
        <StatusBadge status={sale.status} />
      </div>
    </button>
  );
}

export function ExpenseRow({ expense, onClick }: { expense: Expense; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-paper">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caramel-tint text-caramel">
        <Receipt size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{expense.category}</div>
        <div className="mt-0.5 truncate text-sm text-muted">
          {fmtDate(expense.date)}
          {expense.notes ? ` · ${expense.notes}` : ''}
        </div>
      </div>
      <span className="num text-base font-bold">{inr(expense.amount)}</span>
    </button>
  );
}
