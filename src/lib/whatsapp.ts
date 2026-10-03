import type { SaleView, SupplierView } from '../types';
import { pendingBoxes } from './calc';
import { fmtBoxes, fmtDate, inr } from './format';

/** 10-digit Indian numbers get +91; returns digits only (what wa.me expects) */
export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (d.length === 10) return `91${d}`;
  return d;
}

export function buildMessage(sup: SupplierView, sales: SaleView[], piecesPerBox: number): string {
  const useBoxes = piecesPerBox > 1;
  const due = sales.filter((s) => s.supplierId === sup.id && s.pending > 0);
  const lines: string[] = [`Hello ${sup.name},`, ''];

  if (due.length === 0) {
    lines.push('✅ Your account is fully paid. Nothing is pending.');
  } else {
    lines.push('*📋 PENDING SUMMARY*', '━━━━━━━━━━━━━━');
    if (useBoxes) lines.push(`📦 Pending boxes : *${fmtBoxes(pendingBoxes(due, piecesPerBox))}*`);
    lines.push(`💰 Pending amount: *${inr(sup.pending)}*`);
  }

  const last = sup.payments[0];
  lines.push('━━━━━━━━━━━━━━');
  lines.push(last ? `✅ Last payment: *${inr(last.amount)}* on ${fmtDate(last.date)}` : '✅ Last payment: none yet');
  lines.push('', due.length > 0 ? 'Kindly arrange the payment. Thank you! 🙏' : 'Thank you! 🙏');
  return lines.join('\n');
}

export function whatsappUrl(sup: SupplierView, message: string): string {
  const n = waNumber(sup.phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
