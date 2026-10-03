import type { SaleView, SupplierView } from '../types';
import { pendingBoxes, pendingPieces } from './calc';
import { fmtBoxes, fmtDate, inr, round2 } from './format';

/** 10-digit Indian numbers get +91; returns digits only (what wa.me expects) */
export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (d.length === 10) return `91${d}`;
  return d;
}

export function buildMessage(sup: SupplierView, sales: SaleView[], piecesPerBox: number): string {
  const useBoxes = piecesPerBox > 1;
  const due = sales.filter((s) => s.supplierId === sup.id && s.pending > 0).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
  const lines: string[] = [`Hello ${sup.name},`];

  if (due.length === 0) {
    lines.push('', 'Your account is fully paid. Nothing is pending.');
  } else {
    lines.push('', 'Pending payment details:', '');
    for (const s of due) {
      const qty = useBoxes ? `${fmtBoxes(round2(s.quantity / piecesPerBox))} (${s.quantity} pcs)` : `${s.quantity} pcs`;
      const pend = useBoxes ? `${fmtBoxes(round2(pendingPieces(s) / piecesPerBox))}, ${inr(s.pending)}` : inr(s.pending);
      lines.push(`• ${fmtDate(s.date)}: ${qty}, ${inr(s.total)} → pending ${pend}`);
    }
    const totalBoxes = useBoxes ? `${fmtBoxes(pendingBoxes(due, piecesPerBox))}, ` : '';
    lines.push('', `Total pending: ${totalBoxes}${inr(sup.pending)}`);
  }

  const last = sup.payments[0];
  if (last) lines.push(`Last payment: ${inr(last.amount)} on ${fmtDate(last.date)}`);
  if (due.length > 0) lines.push('', 'Kindly arrange the payment. Thank you!');
  else lines.push('', 'Thank you!');
  return lines.join('\n');
}

export function whatsappUrl(sup: SupplierView, message: string): string {
  const n = waNumber(sup.phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
