import { useEffect } from 'react';
import type { PaymentSplit } from '@camp-dilly/shared';

/** Cash is always the auto-computed remainder of (target - upi - cc - cheque)
 * so the numbers can never disagree with the target amount — same
 * invariant as the vanilla build's split editor, now just React state
 * instead of manual DOM wiring. */
export function SplitEditor({
  target, value, onChange, includeCheque = false,
}: { target: number; value: PaymentSplit; onChange: (next: PaymentSplit) => void; includeCheque?: boolean }) {
  const upi = value.upi ?? 0;
  const cc = value.cc ?? 0;
  const cheque = includeCheque ? value.cheque ?? 0 : 0;
  const cash = Math.max(0, Math.round(target - upi - cc - cheque));

  // The Cash figure above is purely derived for display. If the target
  // amount changes (e.g. typing an Advance Amount) and the split is never
  // otherwise touched — the common case for an all-cash payment — nothing
  // above would ever call onChange, so the parent's stored split would
  // silently stay whatever it was initialized to (usually all zero) even
  // though the UI visibly shows the correct cash figure. Keep the two in
  // sync whenever the target changes.
  useEffect(() => {
    if (cash !== (value.cash ?? 0)) onChange({ ...value, cash });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const update = (patch: Partial<PaymentSplit>) => {
    const next = { ...value, ...patch };
    const nUpi = next.upi ?? 0, nCc = next.cc ?? 0, nCheque = includeCheque ? next.cheque ?? 0 : 0;
    onChange({ cash: Math.max(0, Math.round(target - nUpi - nCc - nCheque)), upi: nUpi, cc: nCc, cheque: nCheque });
  };

  const cellClass = 'bg-surface2 border border-border rounded-lg p-2';
  const labelClass = 'text-[10.5px] uppercase text-inkdim font-bold';
  const inputClass = 'bg-transparent border-none p-0 mono font-semibold w-full focus:outline-none';

  return (
    <div className={`grid gap-2 ${includeCheque ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
      <div className={cellClass}>
        <div className={labelClass}>Cash</div>
        <input className={inputClass} value={cash} readOnly />
      </div>
      <div className={cellClass}>
        <div className={labelClass}>UPI</div>
        <input type="number" min={0} className={inputClass} value={upi} onChange={(e) => update({ upi: Number(e.target.value) || 0 })} />
      </div>
      <div className={cellClass}>
        <div className={labelClass}>Credit Card</div>
        <input type="number" min={0} className={inputClass} value={cc} onChange={(e) => update({ cc: Number(e.target.value) || 0 })} />
      </div>
      {includeCheque && (
        <div className={cellClass}>
          <div className={labelClass}>Cheque</div>
          <input type="number" min={0} className={inputClass} value={cheque} onChange={(e) => update({ cheque: Number(e.target.value) || 0 })} />
        </div>
      )}
    </div>
  );
}
