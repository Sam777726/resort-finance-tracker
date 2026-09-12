import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useCreateStoreSale, useDeleteStoreSale, useStoreSales } from '../hooks/useStoreSales';
import { Card } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Field';
import { toast } from '../store/toastStore';
import { apiErrorMessage } from '../lib/api';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);

export function StorePage() {
  const { data: settings } = useSettings();
  const { data: sales } = useStoreSales();
  const create = useCreateStoreSale();
  const del = useDeleteStoreSale();
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState('Cash');

  if (!settings) return <div className="text-inkdim text-sm">Loading…</div>;
  const rows = (sales ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 100);

  const addSale = async (item: { id: string; name: string; price: number }) => {
    try {
      await create.mutateAsync({ date, itemId: item.id, itemName: item.name, qty: 1, unitPrice: item.price, method });
      toast(`${item.name} added`);
    } catch (err) {
      toast(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[22px] font-semibold m-0">In-House Store</h2>
        <div className="text-inkdim text-sm">Ice cream, drinks, costumes, activities & more — tap an item to log a sale</div>
      </div>

      <Card className="p-4">
        <div className="flex gap-2.5 mb-3 flex-wrap">
          <Field label="Sale Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Payment Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {['Cash', 'UPI', 'Credit Card'].map((m) => <option key={m}>{m}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          {settings.store_items.items.map((it) => (
            <button
              key={it.id}
              onClick={() => addSale(it)}
              className="bg-surface2 border border-border rounded-lg p-2.5 text-center hover:border-accent"
            >
              <div className="text-xs font-bold">{it.name}</div>
              <div className="mono text-[11.5px] text-inkdim mt-0.5">{fmt(it.price)}</div>
              <div className="text-accentstrong text-lg leading-none mt-1.5">+</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-[15px] font-semibold mt-0 mb-2.5">Recent Sales</h3>
        {rows.length === 0 ? (
          <div className="text-center py-8 text-inkdim text-sm">No store sales logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
                  <th className="py-2 px-2">Date</th><th className="py-2 px-2">Item</th><th className="py-2 px-2">Qty</th>
                  <th className="py-2 px-2">Amount</th><th className="py-2 px-2">Method</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-none">
                    <td className="py-2 px-2">{r.date}</td>
                    <td className="py-2 px-2">{r.itemName}</td>
                    <td className="py-2 px-2 mono">{r.qty}</td>
                    <td className="py-2 px-2 mono text-right">{fmt(r.amount)}</td>
                    <td className="py-2 px-2">{r.method}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => { if (confirm('Delete this sale?')) del.mutate(r.id, { onSuccess: () => toast('Deleted'), onError: (err) => toast(apiErrorMessage(err)) }); }} className="p-2.5 -m-1 text-inkdim hover:bg-surface2 rounded">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
