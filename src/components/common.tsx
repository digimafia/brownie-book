import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Status } from '../types';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-fade bg-ink/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92dvh] w-full max-w-md animate-sheet overflow-y-auto rounded-t-[28px] bg-white shadow-sheet"
      >
        <div className="sticky top-0 z-10 bg-white px-5 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-paper">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}

const badgeStyle: Record<Status, string> = {
  PAID: 'bg-ok-tint text-ok',
  PARTIAL: 'bg-warn-tint text-warn',
  PENDING: 'bg-bad-tint text-bad',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeStyle[status]}`}>{status}</span>;
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 mt-4 flex items-baseline justify-between px-1 text-sm font-medium text-muted">
      <span>{children}</span>
      {hint}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-base font-semibold">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}

export function PageHeader({ title, right, children }: { title: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur" style={{ top: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        {right}
      </div>
      {children}
    </header>
  );
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'ok' | 'bad' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-ink';
  return (
    <div className="card px-4 py-3.5">
      <div className="text-[13px] text-muted">{label}</div>
      <div className={`num mt-0.5 text-[22px] font-bold ${color}`}>{value}</div>
    </div>
  );
}
