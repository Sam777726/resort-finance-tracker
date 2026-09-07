import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSettings } from '../hooks/useSettings';
import { useCreateExpense, useDeleteExpense, useExpenses } from '../hooks/useExpenses';
import { computeRange } from '../lib/dateRange';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Field';
import { toast } from '../store/toastStore';
import { apiErrorMessage } from '../lib/api';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);

// Straightforward field -> submit form, unlike the booking pages: no
// derived/computed state to keep in sync, so react-hook-form + zod is the
// better fit here than the manual useState draft pattern those use.
const expenseSchema = z.object({
  date: z.string().min(1),
  primary: z.string().min(1),
  sub: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['Cash', 'UPI', 'Credit Card', 'Cheque']),
  vendor: z.string().optional(),
  description: z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

export function ExpensesPage() {
  const { data: settings } = useSettings();
  const [filter, setFilter] = useState({ from: '', to: '', category: '' });
  const { data: expenses } = useExpenses(filter.from || filter.to || filter.category ? filter : undefined);
  const create = useCreateExpense();
  const del = useDeleteExpense();

  const {
    register, handleSubmit, watch, reset, formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: today(), method: 'Cash' },
  });
  const primary = watch('primary');

  const categories = settings ? Object.keys(settings.expense_categories.categories) : [];
  useEffect(() => {
    if (categories.length && !primary) reset((v) => ({ ...v, primary: categories[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  const budgetRange = computeRange('month');
  const monthSpend = useMemo(() => {
    if (!expenses) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.date >= budgetRange.from && e.date <= budgetRange.to) out[e.primary] = (out[e.primary] ?? 0) + e.amount;
    });
    return out;
  }, [expenses, budgetRange.from, budgetRange.to]);

  if (!settings) return <div className="text-inkdim text-sm">Loading…</div>;
  const subOptions = settings.expense_categories.categories[primary] ?? [];
  const budgets = Object.entries(settings.category_budgets.budgets).filter(([, v]) => v > 0);

  const onSubmit = async (data: ExpenseForm) => {
    try {
      await create.mutateAsync(data);
      toast('Expense saved');
      reset({ date: data.date, method: data.method, primary: data.primary });
    } catch (err) {
      toast(apiErrorMessage(err));
    }
  };

  const rows = (expenses ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[22px] font-semibold m-0">Expenses</h2>
        <div className="text-inkdim text-sm">Log costs by category & sub-category</div>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Date"><Input type="date" {...register('date')} /></Field>
            <Field label="Category">
              <Select {...register('primary')}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>
            </Field>
            <Field label="Sub-Category">
              <Select {...register('sub')}>{subOptions.map((s) => <option key={s}>{s}</option>)}</Select>
            </Field>
            <Field label="Amount (₹)" error={errors.amount?.message}>
              <Input type="number" min={0} {...register('amount')} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Payment Method">
              <Select {...register('method')}>{['Cash', 'UPI', 'Credit Card', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</Select>
            </Field>
            <Field label="Vendor (optional)"><Input {...register('vendor')} /></Field>
            <Field label="Description"><Input {...register('description')} /></Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={create.isPending}>Save Expense</Button>
          </div>
        </form>
      </Card>

      {budgets.length > 0 && (
        <Card className="p-4">
          <h3 className="text-[15px] font-semibold mt-0 mb-2.5">This Month — Category Budgets</h3>
          {budgets.map(([cat, limit]) => {
            const spent = monthSpend[cat] ?? 0;
            const pct = Math.min(100, (spent / limit) * 100);
            const tone = pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-amber' : 'bg-accent';
            return (
              <div key={cat} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1"><b>{cat}</b><span className="mono">{fmt(spent)} / {fmt(limit)}</span></div>
                <div className="h-1.5 rounded-full bg-surface2 overflow-hidden"><div className={`h-full ${tone}`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex gap-2.5 mb-3 flex-wrap">
          <Select value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} />
          <Button variant="secondary" size="sm" onClick={() => setFilter({ from: '', to: '', category: '' })}>Clear</Button>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-8 text-inkdim text-sm">No expenses logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
                  <th className="py-2 px-2">Date</th><th className="py-2 px-2">Category</th><th className="py-2 px-2">Sub</th>
                  <th className="py-2 px-2">Amount</th><th className="py-2 px-2">Method</th><th className="py-2 px-2">Note</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-none">
                    <td className="py-2 px-2">{r.date}</td>
                    <td className="py-2 px-2"><span className="bg-surface2 border border-border rounded px-2 py-0.5 text-xs font-semibold">{r.primary}</span></td>
                    <td className="py-2 px-2">{r.sub}</td>
                    <td className="py-2 px-2 mono text-right">{fmt(r.amount)}</td>
                    <td className="py-2 px-2">{r.method}</td>
                    <td className="py-2 px-2">{r.description || r.vendor || '—'}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => { if (confirm('Delete this expense?')) del.mutate(r.id, { onSuccess: () => toast('Deleted') }); }} className="p-1 text-inkdim hover:bg-surface2 rounded">🗑</button>
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
