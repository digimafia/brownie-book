import { useState } from 'react';
import { Empty, PageHeader, StatusBadge } from '../components/common';
import { useData } from '../data';
import { fmtDate, inr } from '../lib/format';
import { useUI } from '../ui';
import { SearchBox } from './Suppliers';

type Filter = 'all' | 'paid' | 'pending';

export function Sales() {
  const { sales } = useData();
  const { open } = useUI();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const list = sales.filter((s) => {
    if (filter === 'paid' && s.status !== 'PAID') return false;
    if (filter === 'pending' && s.status === 'PAID') return false;
    return s.supplierName.toLowerCase().includes(q.trim().toLowerCase());
  });

  const chips: Array<[Filter, string]> = [
    ['all', 'All'],
    ['paid', 'Paid'],
    ['pending', 'Pending'],
  ];

  return (
    <div>
      <PageHeader title="Sales">
        <SearchBox value={q} onChange={setQ} placeholder="Search supplier" />
        <div className="mt-3 flex gap-2">
          {chips.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-10 rounded-full px-5 text-[15px] font-medium transition-colors ${filter === key ? 'bg-cocoa text-white' : 'border border-line bg-white text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="space-y-3 px-4 pb-4">
        {sales.length === 0 ? (
          <Empty title="No sales yet" body="Tap + to record your first sale." />
        ) : list.length === 0 ? (
          <Empty title="No sales match" body="Try another filter or name." />
        ) : (
          list.map((s) => (
            <div key={s.id} className="card overflow-hidden">
              <button onClick={() => open({ t: 'saleDetail', id: s.id })} className="block w-full px-4 pb-3 pt-4 text-left active:bg-paper">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-semibold">{s.supplierName}</div>
                    <div className="num mt-0.5 text-sm text-muted">
                      {fmtDate(s.date)} · {s.quantity} × {inr(s.rate)}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Cell label="Total" value={inr(s.total)} />
                  <Cell label="Received" value={inr(s.received)} tone="ok" />
                  <Cell label="Pending" value={inr(s.pending)} tone={s.pending > 0 ? 'bad' : 'ok'} />
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-ink';
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`num truncate text-[17px] font-bold ${color}`}>{value}</div>
    </div>
  );
}
