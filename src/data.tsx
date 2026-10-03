import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_PIECES_PER_BOX, db } from './db';
import { buildSaleViews, buildSupplierViews, sortExpenses } from './lib/calc';
import type { Expense, SaleView, SupplierView } from './types';

interface Data {
  suppliers: SupplierView[];
  sales: SaleView[];
  expenses: Expense[];
  piecesPerBox: number;
}

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const rawSuppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const rawSales = useLiveQuery(() => db.sales.toArray(), []);
  const rawPayments = useLiveQuery(() => db.payments.toArray(), []);
  const rawExpenses = useLiveQuery(() => db.expenses.toArray(), []);
  const rawSettings = useLiveQuery(() => db.settings.toArray(), []);

  const ready = rawSuppliers && rawSales && rawPayments && rawExpenses && rawSettings;

  const value = useMemo<Data | null>(() => {
    if (!rawSuppliers || !rawSales || !rawPayments || !rawExpenses || !rawSettings) return null;
    const sales = buildSaleViews(rawSales, rawPayments, rawSuppliers);
    return {
      suppliers: buildSupplierViews(rawSuppliers, sales, rawPayments),
      sales,
      expenses: sortExpenses(rawExpenses),
      piecesPerBox: rawSettings.find((x) => x.key === 'piecesPerBox')?.value ?? DEFAULT_PIECES_PER_BOX,
    };
  }, [rawSuppliers, rawSales, rawPayments, rawExpenses, rawSettings]);

  if (!ready || !value) {
    return <div className="flex min-h-dvh items-center justify-center bg-paper text-muted">Opening your books…</div>;
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Data {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
