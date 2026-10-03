import { createContext, useContext } from 'react';

export type Tab = 'dashboard' | 'suppliers' | 'sales' | 'expenses' | 'reports';

export type Modal =
  | { t: 'addMenu' }
  | { t: 'supplier'; id?: number }
  | { t: 'sale'; id?: number; supplierId?: number }
  | { t: 'saleDetail'; id: number }
  | { t: 'payment'; supplierId?: number }
  | { t: 'expense'; id?: number }
  | { t: 'settings' };

export interface UI {
  tab: Tab;
  setTab: (t: Tab) => void;
  open: (m: Modal) => void;
  close: () => void;
  toast: (msg: string) => void;
  confirm: (message: string, confirmLabel: string, onYes: () => void) => void;
  openSupplier: (id: number) => void;
}

export const UIContext = createContext<UI | null>(null);

export function useUI(): UI {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside the app shell');
  return ctx;
}
