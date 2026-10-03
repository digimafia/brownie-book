import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Empty, PageHeader } from '../components/common';
import { useData } from '../data';
import { inr } from '../lib/format';
import { useUI } from '../ui';

export function Suppliers() {
  const { suppliers } = useData();
  const { openSupplier } = useUI();
  const [q, setQ] = useState('');
  const list = suppliers.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()) || s.phone.includes(q.trim()));

  return (
    <div>
      <PageHeader title="Suppliers">
        <SearchBox value={q} onChange={setQ} placeholder="Search supplier" />
      </PageHeader>
      <div className="px-4 pb-4">
        {suppliers.length === 0 ? (
          <Empty title="No suppliers yet" body="Add the restaurants and shops you supply brownies to." />
        ) : list.length === 0 ? (
          <Empty title="No match" body="Try a different name." />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {list.map((s) => (
              <button key={s.id} onClick={() => openSupplier(s.id)} className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-paper">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] font-semibold">{s.name}</div>
                  <div className="num mt-1 text-sm text-muted">Total sales: {inr(s.totalSales)}</div>
                  <div className={`num text-sm font-semibold ${s.pending > 0 ? 'text-bad' : 'text-ok'}`}>Pending: {inr(s.pending)}</div>
                </div>
                <ChevronRight size={20} className="text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mt-3">
      <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field h-12 pl-11" />
    </div>
  );
}
