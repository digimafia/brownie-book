export interface Supplier {
  id: number;
  name: string;
  phone: string;
  notes: string;
  createdAt: number;
}

export interface Sale {
  id: number;
  supplierId: number;
  date: string; // YYYY-MM-DD
  quantity: number;
  rate: number;
  total: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

/** Money received from a supplier. Applied to their oldest unpaid sales first. */
export interface Payment {
  id: number;
  supplierId: number;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Setting {
  key: string;
  value: number;
}

export type Status = 'PAID' | 'PARTIAL' | 'PENDING';

/** Derived (never stored) */
export interface SaleView extends Sale {
  supplierName: string;
  received: number;
  pending: number;
  status: Status;
}

export interface SupplierView extends Supplier {
  totalSales: number;
  received: number;
  pending: number;
  /** Received beyond what is owed (e.g. after a sale was edited or deleted) */
  credit: number;
  saleCount: number;
  /** Newest first */
  payments: Payment[];
}
