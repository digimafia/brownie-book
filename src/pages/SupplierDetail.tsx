import { ArrowLeft, MessageCircle, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { Empty, Stat } from '../components/common';
import { SaleRow } from '../components/Rows';
import { useData } from '../data';
import { db } from '../db';
import { pendingBoxes } from '../lib/calc';
import { fmtBoxes, fmtDate, inr } from '../lib/format';
import { buildMessage, whatsappUrl } from '../lib/whatsapp';
import { useUI } from '../ui';

export function SupplierDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { suppliers, sales, piecesPerBox } = useData();
  const { open, confirm, toast } = useUI();
  const sup = suppliers.find((s) => s.id === id);
  if (!sup) return null;
  const history = sales.filter((s) => s.supplierId === id);
  const boxesDue = pendingBoxes(history, piecesPerBox);

  function share() {
    if (!sup) return;
    const url = whatsappUrl(sup, buildMessage(sup, sales, piecesPerBox));
    window.open(url, '_blank', 'noopener');
  }

  function removePayment(paymentId: number, amount: number) {
    confirm(`Remove the ${inr(amount)} payment? Pending amounts will be recalculated.`, 'Remove payment', async () => {
      await db.payments.delete(paymentId);
      toast('Payment removed');
    });
  }

  return (
    <div className="fixed inset-0 z-30 mx-auto max-w-md animate-slideIn overflow-y-auto bg-paper" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="sticky top-0 z-10 flex items-center justify-between bg-paper/95 px-3 py-3 backdrop-blur">
        <button onClick={onBack} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa active:bg-line/60">
          <ArrowLeft size={24} />
        </button>
        <button onClick={() => open({ t: 'supplier', id })} aria-label="Edit supplier" className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa active:bg-line/60">
          <Pencil size={21} />
        </button>
      </header>

      <div className="space-y-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="px-1">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{sup.name}</h1>
          {sup.phone && (
            <a href={`tel:${sup.phone}`} className="num mt-1 inline-flex h-9 items-center gap-2 text-base text-cocoa">
              <Phone size={16} /> {sup.phone}
            </a>
          )}
          {sup.notes && <p className="mt-1 text-sm text-muted">{sup.notes}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total sales" value={inr(sup.totalSales)} />
          <Stat label="Total received" value={inr(sup.received)} tone="ok" />
          <Stat label="Pending amount" value={inr(sup.pending)} tone={sup.pending > 0 ? 'bad' : 'ok'} />
          {piecesPerBox > 1 ? <Stat label="Pending boxes" value={fmtBoxes(boxesDue)} tone={boxesDue > 0 ? 'bad' : 'ok'} /> : <div />}
        </div>
        {sup.credit > 0 && <p className="num px-1 text-sm text-muted">Received {inr(sup.credit)} more than the sales recorded.</p>}

        <div className="space-y-3">
          <button className="btn-primary" onClick={() => open({ t: 'payment', supplierId: id })}>
            <Plus size={20} /> Receive payment
          </button>
          <button className="btn h-14 w-full bg-[#1E9E55] text-white" onClick={share}>
            <MessageCircle size={20} /> Share pending on WhatsApp
          </button>
          <button className="btn-quiet" onClick={() => open({ t: 'sale', supplierId: id })}>
            <Plus size={20} /> Add sale
          </button>
        </div>

        <section>
          <h2 className="mb-2 px-1 text-base font-semibold">Payments received</h2>
          {sup.payments.length === 0 ? (
            <div className="card">
              <Empty title="No payments yet" />
            </div>
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {sup.payments.map((p) => (
                <div key={p.id} className="flex items-center pl-4 pr-2">
                  <span className="num flex-1 py-3.5 text-sm text-muted">{fmtDate(p.date)}</span>
                  <span className="num mr-1 text-base font-bold text-ok">{inr(p.amount)}</span>
                  <button onClick={() => removePayment(p.id, p.amount)} aria-label="Remove payment" className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-paper">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 px-1 text-base font-semibold">Sales history</h2>
          {history.length === 0 ? (
            <div className="card">
              <Empty title="No sales yet" />
            </div>
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {history.map((s) => (
                <SaleRow key={s.id} sale={s} onClick={() => open({ t: 'saleDetail', id: s.id })} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
