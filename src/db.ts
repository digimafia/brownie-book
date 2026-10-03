import Dexie, { type EntityTable } from 'dexie';
import type { Expense, Payment, Sale, Setting, Supplier } from './types';

export const DEFAULT_PIECES_PER_BOX = 10;

export const db = new Dexie('brownie-book') as Dexie & {
  suppliers: EntityTable<Supplier, 'id'>;
  sales: EntityTable<Sale, 'id'>;
  payments: EntityTable<Payment, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

db.version(1).stores({
  suppliers: '++id, name',
  sales: '++id, supplierId, date',
  payments: '++id, saleId, date',
  expenses: '++id, date, category',
});

// v2: payments belong to the supplier (not a single sale); add settings
db
  .version(2)
  .stores({
    suppliers: '++id, name',
    sales: '++id, supplierId, date',
    payments: '++id, supplierId, date',
    expenses: '++id, date, category',
    settings: 'key',
  })
  .upgrade(async (tx) => {
    const sales: Array<{ id: number; supplierId: number }> = await tx.table('sales').toArray();
    const supplierOf = new Map(sales.map((s) => [s.id, s.supplierId]));
    const old: Array<Record<string, unknown> & { id: number; saleId?: number }> = await tx.table('payments').toArray();
    for (const p of old) {
      const sid = p.saleId !== undefined ? supplierOf.get(p.saleId) : undefined;
      if (sid === undefined) {
        await tx.table('payments').delete(p.id);
        continue;
      }
      const { saleId: _gone, ...rest } = p;
      await tx.table('payments').put({ ...rest, supplierId: sid });
    }
  });

export interface BackupFile {
  app: 'brownie-book';
  version: number;
  exportedAt: string;
  data: {
    suppliers: Supplier[];
    sales: Sale[];
    payments: Payment[];
    expenses: Expense[];
    settings?: Setting[];
  };
}

export async function exportBackup(): Promise<BackupFile> {
  const [suppliers, sales, payments, expenses, settings] = await Promise.all([
    db.suppliers.toArray(),
    db.sales.toArray(),
    db.payments.toArray(),
    db.expenses.toArray(),
    db.settings.toArray(),
  ]);
  return {
    app: 'brownie-book',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { suppliers, sales, payments, expenses, settings },
  };
}

export async function importBackup(file: BackupFile): Promise<void> {
  const d = file.data;
  // Older (v1) backups stored payments against a sale; convert them to supplier payments
  const supplierOf = new Map(d.sales.map((s) => [s.id, s.supplierId]));
  const payments: Payment[] = (d.payments as unknown as Array<Partial<Payment> & { saleId?: number }>).flatMap((p) => {
    const sid = p.supplierId ?? (p.saleId !== undefined ? supplierOf.get(p.saleId) : undefined);
    if (sid === undefined || p.id === undefined || p.amount === undefined || p.date === undefined) return [];
    return [{ id: p.id, supplierId: sid, amount: p.amount, date: p.date, createdAt: p.createdAt ?? Date.now() }];
  });

  await db.transaction('rw', [db.suppliers, db.sales, db.payments, db.expenses, db.settings], async () => {
    await Promise.all([db.suppliers.clear(), db.sales.clear(), db.payments.clear(), db.expenses.clear(), db.settings.clear()]);
    await db.suppliers.bulkAdd(d.suppliers);
    await db.sales.bulkAdd(d.sales);
    await db.payments.bulkAdd(payments);
    await db.expenses.bulkAdd(d.expenses);
    if (d.settings?.length) await db.settings.bulkAdd(d.settings);
  });
}

export function isBackupFile(x: unknown): x is BackupFile {
  if (typeof x !== 'object' || x === null) return false;
  const f = x as Partial<BackupFile>;
  if (f.app !== 'brownie-book' || typeof f.data !== 'object' || f.data === null) return false;
  const d = f.data;
  return Array.isArray(d.suppliers) && Array.isArray(d.sales) && Array.isArray(d.payments) && Array.isArray(d.expenses);
}
