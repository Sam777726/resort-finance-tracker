import { useState } from 'react';
import type { DayPackage, TentType } from '@camp-dilly/shared';
import { useSettings, useUpdateSetting } from '../hooks/useSettings';
import { useCreateStaff, useDeleteStaff, useResetStaffPin, useStaffList } from '../hooks/useStaff';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Field';
import { toast } from '../store/toastStore';
import { apiErrorMessage } from '../lib/api';

// Every "Save" mutation in this file needs this — without an onError, a
// failed save (an expired session, a staff account the API 403s, a
// dropped connection) fails completely silently: the button just does
// nothing, which looks identical to a successful save until the next
// reload shows the old values. Centralized so it can't be forgotten
// per-tab going forward.
const onSaveError = (err: unknown) => toast(apiErrorMessage(err, 'Could not save — check your connection and try again'));

const uid = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const TABS = [
  ['general', 'General'], ['packages', 'Day Packages'], ['units', 'Tent / Room Types'], ['extra', 'Extra-Person Rates'],
  ['store', 'Store Items'], ['categories', 'Expense Categories'], ['budgets', 'Budgets'], ['staff', 'Staff & PINs'],
] as const;
type TabKey = (typeof TABS)[number][0];

export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general');
  const { data: settings } = useSettings();
  if (!settings) return <div className="text-inkdim text-sm">Loading…</div>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[22px] font-semibold m-0">Settings</h2>
      <div className="flex gap-1.5 flex-wrap border-b border-border">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'text-accentstrong border-accent' : 'text-inkdim border-transparent'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab settings={settings} />}
      {tab === 'packages' && <PackagesTab settings={settings} />}
      {tab === 'units' && <UnitsTab settings={settings} />}
      {tab === 'extra' && <ExtraTab settings={settings} />}
      {tab === 'store' && <StoreItemsTab settings={settings} />}
      {tab === 'categories' && <CategoriesTab settings={settings} />}
      {tab === 'budgets' && <BudgetsTab settings={settings} />}
      {tab === 'staff' && <StaffTab />}
    </div>
  );
}

type Settings = NonNullable<ReturnType<typeof useSettings>['data']>;

function GeneralTab({ settings }: { settings: Settings }) {
  const [g, setG] = useState(settings.general);
  const update = useUpdateSetting();
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Resort Name"><Input value={g.resortName} onChange={(e) => setG((v) => ({ ...v, resortName: e.target.value }))} /></Field>
        <Field label="Food Cost / Head (₹)"><Input type="number" value={g.foodCostPerHead} onChange={(e) => setG((v) => ({ ...v, foodCostPerHead: Number(e.target.value) || 0 }))} /></Field>
        <Field label="Walk-in Surcharge / Pax (₹)"><Input type="number" value={g.walkInSurcharge} onChange={(e) => setG((v) => ({ ...v, walkInSurcharge: Number(e.target.value) || 0 }))} /></Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => update.mutate({ key: 'general', value: g }, { onSuccess: () => toast('Saved'), onError: onSaveError })} disabled={update.isPending}>Save</Button>
      </div>
    </Card>
  );
}

function PackagesTab({ settings }: { settings: Settings }) {
  const [items, setItems] = useState<DayPackage[]>(settings.day_packages.items);
  const update = useUpdateSetting();
  return (
    <Card className="p-4 flex flex-col gap-3">
      {items.map((p, i) => (
        <div key={p.id} className="border border-border rounded-lg p-3 bg-surface2">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Label"><Input value={p.label} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
            <Field label="Rate (₹)"><Input type="number" value={p.rate} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)))} /></Field>
            <Field label="Meals Included">
              <div className="flex gap-3 pt-2">
                {(['B', 'L', 'H', 'D'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p.meals[m])}
                      onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, meals: { ...x.meals, [m]: e.target.checked ? 1 : 0 } } : x)))}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="danger" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>Remove</Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between">
        <Button variant="secondary" size="sm" onClick={() => setItems((arr) => [...arr, { id: uid(), label: 'New Package', rate: 0, meals: { B: 0, L: 0, H: 0, D: 0 } }])}>
          + Add Package
        </Button>
        <Button onClick={() => update.mutate({ key: 'day_packages', value: { items } }, { onSuccess: () => toast('Packages saved'), onError: onSaveError })} disabled={update.isPending}>Save All</Button>
      </div>
    </Card>
  );
}

function UnitsTab({ settings }: { settings: Settings }) {
  const [items, setItems] = useState<TentType[]>(settings.tent_types.items);
  const update = useUpdateSetting();
  return (
    <Card className="p-4 flex flex-col gap-3">
      {items.map((t, i) => (
        <div key={t.id} className="border border-border rounded-lg p-3 bg-surface2">
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Name"><Input value={t.name} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
            <Field label="Category"><Input value={t.category} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} /></Field>
            <Field label="Capacity"><Input type="number" value={t.capacity} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, capacity: Number(e.target.value) || 0 } : x)))} /></Field>
            <Field label="Base Rate (₹)"><Input type="number" value={t.rate} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)))} /></Field>
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="danger" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>Remove</Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between">
        <Button variant="secondary" size="sm" onClick={() => setItems((arr) => [...arr, { id: uid(), name: 'New Type', category: '', capacity: 2, rate: 0 }])}>+ Add Type</Button>
        <Button onClick={() => update.mutate({ key: 'tent_types', value: { items } }, { onSuccess: () => toast('Saved'), onError: onSaveError })} disabled={update.isPending}>Save All</Button>
      </div>
    </Card>
  );
}

function ExtraTab({ settings }: { settings: Settings }) {
  const [r, setR] = useState(settings.extra_person_rates);
  const update = useUpdateSetting();
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Below 5 yrs"><Input type="number" value={r.below5} onChange={(e) => setR((v) => ({ ...v, below5: Number(e.target.value) || 0 }))} /></Field>
        <Field label="5-10 yrs"><Input type="number" value={r.age5to10} onChange={(e) => setR((v) => ({ ...v, age5to10: Number(e.target.value) || 0 }))} /></Field>
        <Field label="Above 10 yrs"><Input type="number" value={r.above10} onChange={(e) => setR((v) => ({ ...v, above10: Number(e.target.value) || 0 }))} /></Field>
      </div>
      <div className="text-xs text-inkdim">Applies to overnight guests beyond a unit&apos;s base capacity, charged per night.</div>
      <div className="flex justify-end"><Button onClick={() => update.mutate({ key: 'extra_person_rates', value: r }, { onSuccess: () => toast('Saved'), onError: onSaveError })} disabled={update.isPending}>Save</Button></div>
    </Card>
  );
}

function StoreItemsTab({ settings }: { settings: Settings }) {
  const [items, setItems] = useState(settings.store_items.items);
  const update = useUpdateSetting();
  return (
    <Card className="p-4 flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.id} className="border border-border rounded-lg p-3 bg-surface2">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Item Name"><Input value={it.name} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
            <Field label="Price (₹)"><Input type="number" value={it.price} onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)))} /></Field>
          </div>
          <div className="flex justify-end mt-2"><Button variant="danger" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>Remove</Button></div>
        </div>
      ))}
      <div className="flex justify-between">
        <Button variant="secondary" size="sm" onClick={() => setItems((arr) => [...arr, { id: uid(), name: 'New Item', price: 0 }])}>+ Add Item</Button>
        <Button onClick={() => update.mutate({ key: 'store_items', value: { items } }, { onSuccess: () => toast('Saved'), onError: onSaveError })} disabled={update.isPending}>Save All</Button>
      </div>
    </Card>
  );
}

function CategoriesTab({ settings }: { settings: Settings }) {
  const [cats, setCats] = useState(settings.expense_categories.categories);
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const update = useUpdateSetting();

  // Optimistic (the UI updates instantly on every tap — add/remove
  // category/sub-category happen constantly here and waiting on a
  // round-trip for each would feel sluggish), but that means a failed
  // save needs an explicit rollback: without it, a rejected request (an
  // expired session, a non-admin somehow reaching this page) would leave
  // the screen showing a change that was never actually saved, which is
  // worse than not optimistic-updating at all — it looks like it worked.
  const persist = (next: Record<string, string[]>, successMessage?: string) => {
    const previous = cats;
    setCats(next);
    update.mutate(
      { key: 'expense_categories', value: { categories: next } },
      {
        onSuccess: () => { if (successMessage) toast(successMessage); },
        onError: (err) => { setCats(previous); onSaveError(err); },
      },
    );
  };

  return (
    <Card className="p-4 flex flex-col gap-3">
      {Object.entries(cats).map(([cat, subs]) => (
        <div key={cat} className="border border-border rounded-lg p-3 bg-surface2">
          <div className="flex justify-between items-center font-bold text-sm">
            <span>{cat}</span>
            <button onClick={() => { const { [cat]: _, ...rest } = cats; persist(rest); }} className="text-inkdim text-xs">🗑 remove category</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {subs.map((s) => (
              <span key={s} className="bg-surface border border-border rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1.5">
                {s}
                <button onClick={() => persist({ ...cats, [cat]: subs.filter((x) => x !== s) })} className="text-inkdim">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input placeholder="New sub-category" value={newSub[cat] ?? ''} onChange={(e) => setNewSub((v) => ({ ...v, [cat]: e.target.value }))} />
            <Button
              size="sm" variant="secondary"
              onClick={() => { const val = (newSub[cat] ?? '').trim(); if (val) { persist({ ...cats, [cat]: [...subs, val] }); setNewSub((v) => ({ ...v, [cat]: '' })); } }}
            >
              + Add
            </Button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="New primary category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        <Button
          size="sm" variant="secondary"
          onClick={() => { if (newCat.trim()) { persist({ ...cats, [newCat.trim()]: ['Other'] }, 'Category added'); setNewCat(''); } }}
        >
          + Add Category
        </Button>
      </div>
    </Card>
  );
}

function BudgetsTab({ settings }: { settings: Settings }) {
  const [budgets, setBudgets] = useState(settings.category_budgets.budgets);
  const update = useUpdateSetting();
  const categories = Object.keys(settings.expense_categories.categories);
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="text-xs text-inkdim">Set a monthly ₹ limit per category (0 = no limit).</div>
      <div className="grid sm:grid-cols-3 gap-3">
        {categories.map((c) => (
          <Field key={c} label={c}>
            <Input type="number" min={0} value={budgets[c] ?? 0} onChange={(e) => setBudgets((v) => ({ ...v, [c]: Number(e.target.value) || 0 }))} />
          </Field>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => update.mutate({ key: 'category_budgets', value: { budgets } }, { onSuccess: () => toast('Budgets saved'), onError: onSaveError })} disabled={update.isPending}>Save Budgets</Button>
      </div>
    </Card>
  );
}

function StaffTab() {
  const { data: staff } = useStaffList();
  const create = useCreateStaff();
  const resetPin = useResetStaffPin();
  const del = useDeleteStaff();
  const [form, setForm] = useState({ name: '', role: 'staff' as 'admin' | 'staff', pin: '', pin2: '' });

  const addStaff = async () => {
    if (!form.name.trim()) return toast('Enter a name');
    if (!/^\d{4,6}$/.test(form.pin) || form.pin !== form.pin2) return toast('PIN must match & be 4-6 digits');
    try {
      await create.mutateAsync({ name: form.name.trim(), role: form.role, pin: form.pin });
      toast('Staff added');
      setForm({ name: '', role: 'staff', pin: '', pin2: '' });
    } catch (err) {
      toast(apiErrorMessage(err));
    }
  };

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase text-inkdim border-b border-border"><th className="py-2">Name</th><th className="py-2">Role</th><th></th></tr></thead>
          <tbody>
            {(staff ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-none">
                <td className="py-1.5">{s.name}</td>
                <td className="py-1.5">{s.role}</td>
                <td className="py-1.5">
                  <button
                    className="text-xs text-inkdim mr-3"
                    onClick={async () => {
                      const pin = prompt('New PIN (4-6 digits):');
                      if (!pin) return;
                      if (!/^\d{4,6}$/.test(pin)) return toast('PIN must be 4-6 digits');
                      try { await resetPin.mutateAsync({ id: s.id, pin }); toast('PIN updated'); } catch (err) { toast(apiErrorMessage(err)); }
                    }}
                  >
                    Reset PIN
                  </button>
                  {(staff?.length ?? 0) > 1 && (
                    <button
                      className="text-xs text-inkdim"
                      onClick={async () => { if (confirm('Remove this staff member?')) { try { await del.mutateAsync(s.id); toast('Removed'); } catch (err) { toast(apiErrorMessage(err)); } } }}
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border pt-3">
        <h3 className="text-sm font-semibold mt-0 mb-2.5">Add Staff Member</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} /></Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value as 'admin' | 'staff' }))}>
              <option value="staff">staff</option><option value="admin">admin</option>
            </Select>
          </Field>
          <Field label="PIN (4-6 digits)"><Input inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm((v) => ({ ...v, pin: e.target.value }))} /></Field>
          <Field label="Confirm PIN"><Input inputMode="numeric" maxLength={6} value={form.pin2} onChange={(e) => setForm((v) => ({ ...v, pin2: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end mt-2.5"><Button onClick={addStaff} disabled={create.isPending}>Add Staff</Button></div>
      </div>
    </Card>
  );
}
