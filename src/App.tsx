import { useCallback, useMemo, useState } from 'react';
import { BarChart3, FileBarChart, LayoutDashboard, Plus, Store, Wallet } from 'lucide-react';
import { Sheet } from './components/common';
import { ExpenseForm, PaymentForm, SaleDetail, SaleForm, Settings, SupplierForm } from './components/Forms';
import { DataProvider } from './data';
import { Dashboard, AddMenuButtons } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Sales } from './pages/Sales';
import { SupplierDetail } from './pages/SupplierDetail';
import { Suppliers } from './pages/Suppliers';
import { UIContext, type Modal, type Tab, type UI } from './ui';

const TABS: Array<{ id: Tab; label: string; Icon: typeof Plus }> = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'suppliers', label: 'Suppliers', Icon: Store },
  { id: 'sales', label: 'Sales', Icon: BarChart3 },
  { id: 'expenses', label: 'Expenses', Icon: Wallet },
  { id: 'reports', label: 'Reports', Icon: FileBarChart },
];

interface Pending {
  message: string;
  label: string;
  onYes: () => void;
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const [tab, setTabState] = useState<Tab>('dashboard');
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null);

  const setTab = useCallback((t: Tab) => {
    setSupplierId(null);
    setTabState(t);
    window.scrollTo({ top: 0 });
  }, []);

  const ui = useMemo<UI>(
    () => ({
      tab,
      setTab,
      open: (m) => setModal(m),
      close: () => setModal(null),
      toast: (text) => setToastMsg({ id: Date.now(), text }),
      confirm: (message, label, onYes) => setPending({ message, label, onYes }),
      openSupplier: (id) => setSupplierId(id),
    }),
    [tab, setTab],
  );

  function fabAction() {
    if (tab === 'suppliers') setModal({ t: 'supplier' });
    else if (tab === 'sales') setModal({ t: 'sale' });
    else if (tab === 'expenses') setModal({ t: 'expense' });
    else setModal({ t: 'addMenu' });
  }

  const fabLabel = tab === 'suppliers' ? 'Add supplier' : tab === 'sales' ? 'Add sale' : tab === 'expenses' ? 'Add expense' : 'Quick add';

  return (
    <UIContext.Provider value={ui}>
      <div className="relative mx-auto min-h-dvh max-w-md bg-paper">
        <main key={tab} className="animate-fade pb-[calc(8rem+env(safe-area-inset-bottom))]">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'suppliers' && <Suppliers />}
          {tab === 'sales' && <Sales />}
          {tab === 'expenses' && <Expenses />}
          {tab === 'reports' && <Reports />}
        </main>

        {supplierId !== null && <SupplierDetail id={supplierId} onBack={() => setSupplierId(null)} />}

        {supplierId === null && (
          <div className="pointer-events-none fixed inset-x-0 z-20 mx-auto flex max-w-md justify-end px-5" style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}>
            <button onClick={fabAction} aria-label={fabLabel} className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-cocoa text-white shadow-fab transition-transform active:scale-95">
              <Plus size={30} strokeWidth={2.4} />
            </button>
          </div>
        )}

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ul className="grid grid-cols-5">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <li key={id}>
                  <button onClick={() => setTab(id)} aria-current={active ? 'page' : undefined} className={`flex h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-xs font-medium ${active ? 'text-cocoa' : 'text-muted'}`}>
                    <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-cocoa-tint' : ''}`}>
                      <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {modal?.t === 'addMenu' && (
          <Sheet title="Quick add" onClose={() => setModal(null)}>
            <AddMenuButtons />
          </Sheet>
        )}
        {modal?.t === 'supplier' && <SupplierForm key={modal.id ?? 'new'} id={modal.id} />}
        {modal?.t === 'sale' && <SaleForm key={`sale-${modal.id ?? 'new'}-${modal.supplierId ?? ''}`} id={modal.id} supplierId={modal.supplierId} />}
        {modal?.t === 'saleDetail' && <SaleDetail key={modal.id} id={modal.id} />}
        {modal?.t === 'payment' && <PaymentForm key={modal.supplierId ?? 'any'} supplierId={modal.supplierId} />}
        {modal?.t === 'expense' && <ExpenseForm key={modal.id ?? 'new'} id={modal.id} />}
        {modal?.t === 'settings' && <Settings />}

        {pending && (
          <Sheet title="Are you sure?" onClose={() => setPending(null)}>
            <p className="pb-5 text-base text-muted">{pending.message}</p>
            <div className="space-y-3">
              <button
                className="btn-danger"
                onClick={async () => {
                  const p = pending;
                  setPending(null);
                  setModal(null);
                  await p.onYes();
                }}
              >
                {pending.label}
              </button>
              <button className="btn-quiet" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </Sheet>
        )}

        {toastMsg && (
          <div key={toastMsg.id} className="pointer-events-none fixed inset-x-0 z-[60] mx-auto flex max-w-md justify-center px-5" style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }} onAnimationEnd={() => setToastMsg(null)}>
            <div className="animate-toast rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-fab">{toastMsg.text}</div>
          </div>
        )}
      </div>
    </UIContext.Provider>
  );
}
