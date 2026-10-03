import { buildSaleViews, buildSupplierViews, pendingBoxes, summarize } from '../src/lib/calc';
import { inr } from '../src/lib/format';
import { buildMessage, waNumber } from '../src/lib/whatsapp';
import type { Expense, Payment, Sale, Supplier } from '../src/types';

let failed = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${String(got)}${ok ? '' : `  (wanted ${String(want)})`}`);
};

const today = '2026-10-02';
const suppliers: Supplier[] = [{ id: 1, name: 'ABC Cafe', phone: '9876543210', notes: '', createdAt: 1 }];
const sale = (id: number, date: string, quantity: number, rate: number): Sale => ({ id, supplierId: 1, date, quantity, rate, total: quantity * rate, notes: '', createdAt: id, updatedAt: id });
const pay = (id: number, amount: number, date = today): Payment => ({ id, supplierId: 1, amount, date, createdAt: 100 + id });

// ---- Your ABC Cafe example (payments now belong to the supplier)
const sales: Sale[] = [sale(1, today, 100, 35)];
const payments: Payment[] = [pay(1, 2000)];
const expenses: Expense[] = [];

let sv = buildSaleViews(sales, payments, suppliers);
eq('total', sv[0].total, 3500);
eq('pending', sv[0].pending, 1500);
eq('status partial', sv[0].status, 'PARTIAL');
let sm = summarize(sv, expenses, today);
eq('dashboard sales', sm.monthSales, 3500);
eq('dashboard pending', sm.monthPending, 1500);

payments.push(pay(2, 1000));
sv = buildSaleViews(sales, payments, suppliers);
eq('pending after 1000', sv[0].pending, 500);

expenses.push({ id: 1, date: today, category: 'Ingredients', amount: 1200, notes: '', createdAt: 5, updatedAt: 5 });
sm = summarize(sv, expenses, today);
eq('month profit', sm.monthProfit, 2300);
eq('month pending', sm.monthPending, 500);

// ---- Lump sum across several sales, oldest first
const s2: Sale[] = [sale(1, '2026-09-20', 100, 35), sale(2, '2026-09-27', 50, 35), sale(3, '2026-10-01', 30, 35)];
const p2: Payment[] = [pay(1, 3850, '2026-10-02')]; // 11 boxes at 10 pcs x Rs35
const v2 = buildSaleViews(s2, p2, suppliers);
const byId = (id: number) => v2.find((s) => s.id === id)!;
eq('oldest sale paid', byId(1).status, 'PAID');
eq('second sale partial', byId(2).status, 'PARTIAL');
eq('second sale pending', byId(2).pending, 1400);
eq('newest untouched', byId(3).status, 'PENDING');
const sup2 = buildSupplierViews(suppliers, v2, p2)[0];
eq('supplier pending', sup2.pending, 1400 + 1050);
eq('supplier received', sup2.received, 3850);
eq('pending boxes (10 pcs/box)', pendingBoxes(v2, 10), 7);

// ---- Delete a payment recalculates
const v3 = buildSaleViews(s2, [], suppliers);
eq('no payments -> all pending', v3.every((s) => s.status === 'PENDING'), true);

// ---- WhatsApp message
const msg = buildMessage(sup2, v2, 10);
console.log('\n--- WhatsApp message ---\n' + msg + '\n-----------------------\n');
eq('msg has total', msg.includes('Total pending: 7 boxes, ₹2,450'), true);
eq('msg has last payment', msg.includes('Last payment: ₹3,850'), true);
eq('msg skips paid sale', msg.includes('20 Sep'), false);
eq('wa number', waNumber('98765 43210'), '919876543210');
eq('wa number with 0', waNumber('09876543210'), '919876543210');

eq('inr 125000', inr(125000), '₹1,25,000');

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('all passed');
