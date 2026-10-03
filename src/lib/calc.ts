import type { Expense, Payment, Sale, SaleView, Status, Supplier, SupplierView } from '../types';
import { round2 } from './format';

export function statusOf(total: number, received: number): Status {
  if (received <= 0) return 'PENDING';
  if (round2(received) >= round2(total)) return 'PAID';
  return 'PARTIAL';
}

const byDateDesc = <T extends { date: string; createdAt: number }>(a: T, b: T) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt;

/**
 * Payments are recorded per supplier. They are applied to that supplier's
 * sales oldest-first, so every sale still gets a received / pending / status.
 */
export function buildSaleViews(sales: Sale[], payments: Payment[], suppliers: Supplier[]): SaleView[] {
  const names = new Map(suppliers.map((s) => [s.id, s.name]));
  const paidBySupplier = new Map<number, number>();
  for (const p of payments) paidBySupplier.set(p.supplierId, round2((paidBySupplier.get(p.supplierId) ?? 0) + p.amount));

  const bySupplier = new Map<number, Sale[]>();
  for (const s of sales) {
    const list = bySupplier.get(s.supplierId);
    if (list) list.push(s);
    else bySupplier.set(s.supplierId, [s]);
  }

  const views: SaleView[] = [];
  for (const [supplierId, list] of bySupplier) {
    let pool = paidBySupplier.get(supplierId) ?? 0;
    const oldestFirst = list.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
    for (const s of oldestFirst) {
      const received = round2(Math.min(pool, s.total));
      pool = round2(pool - received);
      views.push({
        ...s,
        supplierName: names.get(supplierId) ?? 'Unknown supplier',
        received,
        pending: round2(s.total - received),
        status: statusOf(s.total, received),
      });
    }
  }
  return views.sort(byDateDesc);
}

export function buildSupplierViews(suppliers: Supplier[], sales: SaleView[], payments: Payment[]): SupplierView[] {
  return suppliers
    .map((sup): SupplierView => {
      const mine = sales.filter((s) => s.supplierId === sup.id);
      const myPayments = payments.filter((p) => p.supplierId === sup.id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
      const totalSales = round2(mine.reduce((a, s) => a + s.total, 0));
      const received = round2(myPayments.reduce((a, p) => a + p.amount, 0));
      return {
        ...sup,
        totalSales,
        received,
        pending: round2(mine.reduce((a, s) => a + s.pending, 0)),
        credit: round2(Math.max(0, received - totalSales)),
        saleCount: mine.length,
        payments: myPayments,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Pieces still unpaid on a sale (pending money / price per piece) */
export const pendingPieces = (s: SaleView): number => (s.rate > 0 ? s.pending / s.rate : 0);

export function pendingBoxes(sales: SaleView[], piecesPerBox: number): number {
  if (piecesPerBox <= 0) return 0;
  return round2(sales.reduce((a, s) => a + pendingPieces(s), 0) / piecesPerBox);
}

export function sortExpenses(expenses: Expense[]): Expense[] {
  return expenses.slice().sort(byDateDesc);
}

const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));

export interface Summary {
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  monthSales: number;
  monthExpenses: number;
  monthProfit: number;
  /** Total of this month's sales minus what has been received against those sales */
  monthPending: number;
  /** Still unpaid on sales made before this month */
  olderPending: number;
}

export function summarize(sales: SaleView[], expenses: Expense[], today: string): Summary {
  const mk = today.slice(0, 7);
  const inMonth = sales.filter((s) => s.date.startsWith(mk));
  const older = sales.filter((s) => !s.date.startsWith(mk) && s.date < today);
  const todaySales = sum(sales.filter((s) => s.date === today).map((s) => s.total));
  const todayExpenses = sum(expenses.filter((e) => e.date === today).map((e) => e.amount));
  const monthSales = sum(inMonth.map((s) => s.total));
  const monthExpenses = sum(expenses.filter((e) => e.date.startsWith(mk)).map((e) => e.amount));
  return {
    todaySales,
    todayExpenses,
    todayProfit: round2(todaySales - todayExpenses),
    monthSales,
    monthExpenses,
    monthProfit: round2(monthSales - monthExpenses),
    monthPending: round2(monthSales - sum(inMonth.map((s) => s.received))),
    olderPending: sum(older.map((s) => s.pending)),
  };
}

export interface WeekBucket {
  label: string;
  sales: number;
  expenses: number;
}

export function weekBuckets(sales: Sale[], expenses: Expense[], today: string): WeekBucket[] {
  const [y, m] = today.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const ranges: Array<[number, number]> = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, last],
  ];
  const mk = today.slice(0, 7);
  const dayOf = (d: string) => Number(d.slice(8, 10));
  return ranges.map(([from, to]) => ({
    label: `${from}–${to}`,
    sales: sum(sales.filter((s) => s.date.startsWith(mk) && dayOf(s.date) >= from && dayOf(s.date) <= to).map((s) => s.total)),
    expenses: sum(expenses.filter((e) => e.date.startsWith(mk) && dayOf(e.date) >= from && dayOf(e.date) <= to).map((e) => e.amount)),
  }));
}
