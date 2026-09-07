import { useMemo } from 'react';
import { useDayEntries } from '../hooks/useDayEntries';
import { useOvernightEntries } from '../hooks/useOvernightEntries';
import { Card } from '../components/ui/Card';
import { PendingList, type PendingItem } from '../components/PendingList';

export function PaymentsPage() {
  const { data: day } = useDayEntries();
  const { data: overnight } = useOvernightEntries();

  const pending = useMemo<PendingItem[]>(() => {
    const d = (day ?? []).filter((e) => e.balance.status === 'pending').map((e) => ({
      id: e.id, kind: 'day' as const, refDate: e.date, amount: e.balance.amount, notes: e.notes,
    }));
    const o = (overnight ?? []).filter((e) => e.balance.status === 'pending').map((e) => ({
      id: e.id, kind: 'overnight' as const, refDate: e.checkIn, amount: e.balance.amount, notes: e.notes,
    }));
    return [...d, ...o].sort((a, b) => (a.refDate < b.refDate ? -1 : 1));
  }, [day, overnight]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[22px] font-semibold m-0">Pending Payments</h2>
        <div className="text-inkdim text-sm">Balance amounts awaiting receipt — oldest first</div>
      </div>
      <Card className="p-4">
        <PendingList items={pending} />
      </Card>
    </div>
  );
}
