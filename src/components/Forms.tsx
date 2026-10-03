import { useMemo, useRef, useState } from 'react';
import { CalendarDays, Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { DEFAULT_PIECES_PER_BOX, db, exportBackup, importBackup, isBackupFile } from '../db';
import { useData } from '../data';
import { cleanNumber, fmtBoxes, fmtDate, inr, num, round2, todayStr } from '../lib/format';
import { useUI } from '../ui';
import { Label, Sheet, StatusBadge } from './common';

/* ---------------------------------- Supplier --------------------------------- */

export function SupplierForm({ id }: { id?: number }) {
  const { suppliers } = useData();
  const { close, toast } = useUI();
  const existing = suppliers.find((s) => s.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState('');

  async function save() {
    const n = name.trim();
    if (!n) return setError('Enter the restaurant or shop name.');
    const dup = suppliers.some((s) => s.id !== id && s.name.trim().toLowerCase() === n.toLowerCase());
    if (dup) return setError('A supplier with this name already exists.');
    if (existing) {
      await db.suppliers.update(existing.id, { name: n, phone: phone.trim(), notes: notes.trim() });
      toast('Supplier updated');
      close();
    } else {
      await db.suppliers.add({ name: n, phone: phone.trim(), notes: notes.trim(), createdAt: Date.now() });
      toast('Supplier added');
      close();
    }
  }

  return (
    <Sheet title={existing ? 'Edit supplier' : 'Add supplier'} onClose={close}>
      <Label>Restaurant / shop name</Label>
      <input className="field" value={name} onChange={(e) => (setName(e.target.value), setError(''))} placeholder="ABC Cafe" autoFocus />
      <Label>Mobile number</Label>
      <input className="field num" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ''))} placeholder="9876543210" />
      <Label>Notes (optional)</Label>
      <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery before 8 AM" />
      {error && <p className="mt-3 px-1 text-sm text-bad">{error}</p>}
      <div className="mt-6">
        <button className="btn-primary" onClick={save}>
          Save supplier
        </button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------ Sale ----------------------------------- */

export function SaleForm({ id, supplierId }: { id?: number; supplierId?: number }) {
  const { suppliers, sales, piecesPerBox } = useData();
  const { close, toast, open, confirm } = useUI();
  const existing = sales.find((s) => s.id === id);

  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [supplier, setSupplier] = useState<string>(existing ? String(existing.supplierId) : supplierId ? String(supplierId) : suppliers.length === 1 ? String(suppliers[0].id) : '');
  const [qty, setQty] = useState(existing ? String(existing.quantity) : '');
  const [rate, setRate] = useState(existing ? String(existing.rate) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState('');
  const rateTouched = useRef(!!existing);

  // When a new sale is started for a supplier, suggest the rate used last time
  const lastRate = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of sales) if (!m.has(s.supplierId)) m.set(s.supplierId, s.rate); // sales are newest first
    return m;
  }, [sales]);

  const total = round2(num(qty) * num(rate));

  function pickSupplier(v: string) {
    setSupplier(v);
    setError('');
    if (!existing && !rateTouched.current && v) {
      const r = lastRate.get(Number(v));
      if (r !== undefined) setRate(String(r));
    }
  }

  if (suppliers.length === 0) {
    return (
      <Sheet title="Add sale" onClose={close}>
        <p className="py-4 text-base text-muted">Add the restaurant or shop you supply first, then record sales for it.</p>
        <button className="btn-primary" onClick={() => open({ t: 'supplier' })}>
          <Plus size={20} /> Add supplier
        </button>
      </Sheet>
    );
  }

  async function save() {
    if (!supplier) return setError('Choose a supplier.');
    if (num(qty) <= 0) return setError('Enter the quantity.');
    if (num(rate) <= 0) return setError('Enter the rate per brownie.');
    const now = Date.now();
    if (existing) {
      await db.sales.update(existing.id, { supplierId: Number(supplier), date, quantity: num(qty), rate: num(rate), total, notes: notes.trim(), updatedAt: now });
      toast('Sale updated');
    } else {
      await db.sales.add({ supplierId: Number(supplier), date, quantity: num(qty), rate: num(rate), total, notes: notes.trim(), createdAt: now, updatedAt: now });
      toast('Sale added');
    }
    close();
  }

  function remove() {
    if (!existing) return;
    confirm(`Delete this ${inr(existing.total)} sale to ${existing.supplierName}?`, 'Delete sale', async () => {
      await db.sales.delete(existing.id);
      toast('Sale deleted');
    });
  }

  const showBoxes = piecesPerBox > 1 && num(qty) > 0 && num(rate) > 0;

  return (
    <Sheet title={existing ? 'Edit sale' : 'Add sale'} onClose={close}>
      <Label>Supplier</Label>
      <select className="field appearance-none" value={supplier} onChange={(e) => pickSupplier(e.target.value)}>
        <option value="">Choose supplier</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Quantity (pcs)</Label>
          <input className="field num" inputMode="numeric" value={qty} onChange={(e) => (setQty(cleanNumber(e.target.value).split('.')[0]), setError(''))} placeholder="100" />
        </div>
        <div>
          <Label>Rate (₹)</Label>
          <input
            className="field num"
            inputMode="decimal"
            value={rate}
            onChange={(e) => {
              rateTouched.current = true;
              setRate(cleanNumber(e.target.value));
              setError('');
            }}
            placeholder="35"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-cocoa-tint px-4 py-3">
        <div className="text-sm text-muted">Total amount</div>
        <div className="num text-[28px] font-bold leading-tight">{inr(total)}</div>
        {showBoxes && (
          <div className="num mt-0.5 text-sm text-muted">
            {fmtBoxes(round2(num(qty) / piecesPerBox))} · 1 box = {inr(round2(num(rate) * piecesPerBox))}
          </div>
        )}
      </div>
      <p className="mt-2 px-1 text-sm text-muted">Payments are added from the supplier page.</p>

      <Label>Date</Label>
      <div className="relative">
        <input type="date" className="field appearance-none" value={date} max="9999-12-31" onChange={(e) => setDate(e.target.value || todayStr())} />
        <CalendarDays size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
      <Label>Notes (optional)</Label>
      <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Walnut, double chocolate…" />

      {error && <p className="mt-3 px-1 text-sm text-bad">{error}</p>}
      <div className="mt-6 space-y-3">
        <button className="btn-primary" onClick={save}>
          Save sale
        </button>
        {existing && (
          <button className="btn-danger" onClick={remove}>
            <Trash2 size={19} /> Delete sale
          </button>
        )}
      </div>
    </Sheet>
  );
}

/* --------------------------------- Sale detail -------------------------------- */

export function SaleDetail({ id }: { id: number }) {
  const { sales, piecesPerBox } = useData();
  const { close, open } = useUI();
  const sale = sales.find((s) => s.id === id);
  if (!sale) return null;

  return (
    <Sheet title={sale.supplierName} onClose={close}>
      <div className="flex items-center justify-between">
        <span className="num text-sm text-muted">
          {fmtDate(sale.date)} · {sale.quantity} × {inr(sale.rate)}
          {piecesPerBox > 1 ? ` · ${fmtBoxes(round2(sale.quantity / piecesPerBox))}` : ''}
        </span>
        <StatusBadge status={sale.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Mini label="Total" value={inr(sale.total)} />
        <Mini label="Received" value={inr(sale.received)} tone="ok" />
        <Mini label="Pending" value={inr(sale.pending)} tone={sale.pending > 0 ? 'bad' : 'ok'} />
      </div>
      {sale.notes && <p className="mt-3 px-1 text-sm text-muted">{sale.notes}</p>}
      <p className="mt-3 px-1 text-sm text-muted">Payments are applied to the oldest unpaid sales first.</p>

      <div className="mt-5 space-y-3">
        {sale.pending > 0 && (
          <button className="btn-primary" onClick={() => open({ t: 'payment', supplierId: sale.supplierId })}>
            <Plus size={20} /> Receive payment
          </button>
        )}
        <button className="btn-quiet" onClick={() => open({ t: 'sale', id: sale.id })}>
          <Pencil size={18} /> Edit sale
        </button>
      </div>
    </Sheet>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-ink';
  return (
    <div className="rounded-2xl bg-paper px-3 py-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className={`num text-[17px] font-bold ${color}`}>{value}</div>
    </div>
  );
}

/* --------------------------------- Payment ---------------------------------- */

export function PaymentForm({ supplierId }: { supplierId?: number }) {
  const { suppliers, sales, piecesPerBox } = useData();
  const { close, toast } = useUI();
  const [sid, setSid] = useState(supplierId ? String(supplierId) : '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState('');

  const sup = suppliers.find((s) => s.id === Number(sid));
  const pending = sup?.pending ?? 0;
  const entered = num(amount);
  const after = round2(Math.max(0, pending - entered));
  const oldestDue = sup ? sales.filter((s) => s.supplierId === sup.id && s.pending > 0).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))[0] : undefined;
  const boxPrice = oldestDue && piecesPerBox > 1 ? round2(oldestDue.rate * piecesPerBox) : 0;

  async function save() {
    if (!sup) return setError('Choose a supplier.');
    if (pending <= 0) return setError('Nothing is pending for this supplier.');
    if (entered <= 0) return setError('Enter the amount received.');
    if (round2(entered) > pending) return setError(`Only ${inr(pending)} is pending for ${sup.name}.`);
    await db.payments.add({ supplierId: sup.id, amount: round2(entered), date, createdAt: Date.now() });
    toast(after === 0 ? 'Payment added · fully paid' : 'Payment added');
    close();
  }

  return (
    <Sheet title="Receive payment" onClose={close}>
      {supplierId && sup ? (
        <p className="text-lg font-semibold">{sup.name}</p>
      ) : (
        <>
          <Label>Supplier</Label>
          <select className="field appearance-none" value={sid} onChange={(e) => (setSid(e.target.value), setError(''))}>
            <option value="">Choose supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.pending > 0 ? ` · ${inr(s.pending)} pending` : ''}
              </option>
            ))}
          </select>
        </>
      )}

      {sup && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini label="Total sales" value={inr(sup.totalSales)} />
          <Mini label="Received" value={inr(sup.received)} tone="ok" />
          <Mini label="Pending" value={inr(sup.pending)} tone={sup.pending > 0 ? 'bad' : 'ok'} />
        </div>
      )}

      <Label
        hint={
          pending > 0 ? (
            <button type="button" className="font-semibold text-cocoa" onClick={() => setAmount(String(pending))}>
              Full {inr(pending)}
            </button>
          ) : undefined
        }
      >
        Payment received (₹)
      </Label>
      <input className="field num text-xl font-semibold" inputMode="decimal" value={amount} onChange={(e) => (setAmount(cleanNumber(e.target.value)), setError(''))} placeholder="0" autoFocus={!!supplierId} />
      {boxPrice > 0 && (
        <p className="num mt-2 px-1 text-sm text-muted">
          1 box = {inr(boxPrice)}
          {entered > 0 ? ` · ${fmtBoxes(round2(entered / boxPrice))}` : ''}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-sm text-muted">Pending after this</span>
        <span className={`num text-lg font-bold ${after > 0 ? 'text-bad' : 'text-ok'}`}>{inr(entered > pending ? 0 : after)}</span>
      </div>
      <p className="mt-1 px-1 text-sm text-muted">Applied to the oldest unpaid sales first.</p>

      <Label>Date</Label>
      <input type="date" className="field appearance-none" value={date} onChange={(e) => setDate(e.target.value || todayStr())} />

      {error && <p className="mt-3 px-1 text-sm text-bad">{error}</p>}
      <div className="mt-6">
        <button className="btn-primary" onClick={save}>
          Save payment
        </button>
      </div>
    </Sheet>
  );
}

/* --------------------------------- Expense ---------------------------------- */

const CATEGORIES = ['Ingredients', 'Packaging', 'Delivery', 'Gas', 'Electricity', 'Salary', 'Other'];

export function ExpenseForm({ id }: { id?: number }) {
  const { expenses } = useData();
  const { close, toast, confirm } = useUI();
  const existing = expenses.find((e) => e.id === id);
  const isCustom = !!existing && !CATEGORIES.includes(existing.category);

  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [category, setCategory] = useState(isCustom ? 'Other' : existing?.category ?? 'Ingredients');
  const [custom, setCustom] = useState(isCustom ? existing!.category : '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState('');

  async function save() {
    if (num(amount) <= 0) return setError('Enter the amount.');
    const cat = category === 'Other' ? custom.trim() || 'Other' : category;
    const now = Date.now();
    if (existing) {
      await db.expenses.update(existing.id, { date, category: cat, amount: round2(num(amount)), notes: notes.trim(), updatedAt: now });
      toast('Expense updated');
    } else {
      await db.expenses.add({ date, category: cat, amount: round2(num(amount)), notes: notes.trim(), createdAt: now, updatedAt: now });
      toast('Expense added');
    }
    close();
  }

  function remove() {
    if (!existing) return;
    confirm(`Delete this ${inr(existing.amount)} ${existing.category} expense?`, 'Delete expense', async () => {
      await db.expenses.delete(existing.id);
      toast('Expense deleted');
    });
  }

  return (
    <Sheet title={existing ? 'Edit expense' : 'Add expense'} onClose={close}>
      <Label>Amount (₹)</Label>
      <input className="field num text-xl font-semibold" inputMode="decimal" value={amount} onChange={(e) => (setAmount(cleanNumber(e.target.value)), setError(''))} placeholder="0" autoFocus={!existing} />

      <Label>Category</Label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`h-11 rounded-full px-4 text-[15px] font-medium transition-colors ${category === c ? 'bg-cocoa text-white' : 'border border-line bg-white text-ink'}`}
          >
            {c}
          </button>
        ))}
      </div>
      {category === 'Other' && <input className="field mt-3" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="What was it for?" />}

      <Label>Date</Label>
      <input type="date" className="field appearance-none" value={date} onChange={(e) => setDate(e.target.value || todayStr())} />
      <Label>Notes (optional)</Label>
      <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cocoa, butter, sugar" />

      {error && <p className="mt-3 px-1 text-sm text-bad">{error}</p>}
      <div className="mt-6 space-y-3">
        <button className="btn-primary" onClick={save}>
          Save expense
        </button>
        {existing && (
          <button className="btn-danger" onClick={remove}>
            <Trash2 size={19} /> Delete expense
          </button>
        )}
      </div>
    </Sheet>
  );
}

/* --------------------------------- Settings --------------------------------- */

export function Settings() {
  const { piecesPerBox } = useData();
  const { close, toast, confirm } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [ppb, setPpb] = useState(String(piecesPerBox));

  async function saveBox() {
    const n = Math.floor(num(ppb));
    if (n < 1) return setError('Pieces per box must be at least 1.');
    await db.settings.put({ key: 'piecesPerBox', value: n });
    setError('');
    toast('Box size saved');
  }

  async function doExport() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brownie-book-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup saved to your downloads');
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupFile(parsed)) return setError('This file is not a Brownie Book backup.');
      const d = parsed.data;
      confirm(
        `Replace everything on this phone with the backup? It has ${d.suppliers.length} suppliers, ${d.sales.length} sales and ${d.expenses.length} expenses.`,
        'Replace data',
        async () => {
          await importBackup(parsed);
          toast('Backup restored');
        },
      );
    } catch {
      setError('Could not read that file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Sheet title="Settings" onClose={close}>
      <Label>Pieces in one box</Label>
      <div className="flex gap-3">
        <input className="field num" inputMode="numeric" value={ppb} onChange={(e) => setPpb(cleanNumber(e.target.value).split('.')[0])} placeholder={String(DEFAULT_PIECES_PER_BOX)} />
        <button className="btn-quiet !w-28 shrink-0" onClick={saveBox}>
          Save
        </button>
      </div>
      <p className="mt-2 px-1 text-sm text-muted">Used for box counts and the WhatsApp message. Set to 1 to hide boxes.</p>

      <div className="mt-6 px-1 text-sm font-medium text-muted">Backup</div>
      <p className="pb-3 pt-1 text-sm text-muted">Your data lives only on this phone. Save a backup file now and then, and keep it somewhere safe.</p>
      <div className="space-y-3">
        <button className="btn-primary" onClick={doExport}>
          <Download size={20} /> Export backup
        </button>
        <button className="btn-quiet" onClick={() => fileRef.current?.click()}>
          <Upload size={20} /> Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-3 px-1 text-sm text-bad">{error}</p>}
    </Sheet>
  );
}
