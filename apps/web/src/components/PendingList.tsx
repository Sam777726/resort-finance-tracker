import { useState } from 'react';
import type { PaymentSplit } from '@camp-dilly/shared';
import { useMarkDayBalanceReceived } from '../hooks/useDayEntries';
import { useMarkOvernightBalanceReceived } from '../hooks/useOvernightEntries';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { SplitEditor } from './ui/SplitEditor';
import { toast } from '../store/toastStore';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export interface PendingItem {
  id: string;
  kind: 'day' | 'overnight';
  refDate: string;
  amount: number;
  notes?: string;
}

export function PendingList({ items }: { items: PendingItem[] }) {
  const [target, setTarget] = useState<PendingItem | null>(null);

  if (items.length === 0) return <div className="text-center py-8 text-inkdim text-sm">No pending payments 🎉</div>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Type</th>
              {items.some((i) => i.notes) && <th className="py-2 px-2">Notes</th>}
              <th className="py-2 px-2">Amount</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-none">
                <td className="py-2 px-2">{i.refDate}</td>
                <td className="py-2 px-2">{i.kind === 'day' ? 'Day Picnic' : 'Overnight'}</td>
                {items.some((x) => x.notes) && <td className="py-2 px-2">{i.notes || '—'}</td>}
                <td className="py-2 px-2 mono text-right">{fmt(i.amount)}</td>
                <td className="py-2 px-2">
                  <Button size="sm" onClick={() => setTarget(i)}>Mark Received</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {target && <MarkReceivedModal item={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function MarkReceivedModal({ item, onClose }: { item: PendingItem; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [split, setSplit] = useState<PaymentSplit>({ cash: item.amount, upi: 0, cc: 0, cheque: 0 });
  const markDay = useMarkDayBalanceReceived();
  const markOvernight = useMarkOvernightBalanceReceived();
  const pending = markDay.isPending || markOvernight.isPending;

  const confirm = async () => {
    const payload = { status: 'received', split, receivedDate: date };
    try {
      if (item.kind === 'day') await markDay.mutateAsync({ id: item.id, payload });
      else await markOvernight.mutateAsync({ id: item.id, payload });
      toast('Payment marked received');
      onClose();
    } catch {
      toast('Could not update payment');
    }
  };

  return (
    <Modal
      title="Mark Balance as Received"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={pending}>Confirm Received</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11.5px] font-semibold uppercase text-inkdim">Balance Amount</label>
          <Input value={fmt(item.amount)} readOnly />
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase text-inkdim">Received Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <SplitEditor target={item.amount} value={split} onChange={setSplit} includeCheque />
      </div>
    </Modal>
  );
}
