import { useMemo, useState } from 'react';
import { computeDayPicnic } from '@camp-dilly/shared';
import type { PaymentSplit } from '@camp-dilly/shared';
import { useSettings } from '../hooks/useSettings';
import { useCreateDayEntry, useDayEntries, useDeleteDayEntry, useUpdateDayEntry } from '../hooks/useDayEntries';
import type { DayEntry } from '../lib/entryTypes';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Field';
import { Stepper } from '../components/ui/Stepper';
import { SplitEditor } from '../components/ui/SplitEditor';
import { Pill } from '../components/ui/Pill';
import { toast } from '../store/toastStore';
import { apiErrorMessage } from '../lib/api';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);
const MEAL_LABEL: Record<'B' | 'L' | 'H' | 'D', string> = { B: 'Breakfast', L: 'Lunch', H: 'Hi-Tea', D: 'Dinner' };

interface Draft {
  date: string;
  packageId: string;
  walkIn: boolean;
  tentId: string;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
  discountAmount: number;
  advanceAmount: number;
  advanceDate: string;
  advanceSplit: PaymentSplit;
  partialAmount: number;
  partialDate: string;
  partialSplit: PaymentSplit;
  balanceStatus: 'pending' | 'received';
  balanceSplit: PaymentSplit;
  balanceReceivedDate: string;
  notes: string;
}

function blankDraft(defaultPackageId: string): Draft {
  return {
    date: today(), packageId: defaultPackageId, walkIn: false, tentId: '',
    paxBelow5: 0, pax5to10: 0, paxAbove10: 0, discountAmount: 0,
    advanceAmount: 0, advanceDate: today(), advanceSplit: { cash: 0, upi: 0, cc: 0 },
    partialAmount: 0, partialDate: today(), partialSplit: { cash: 0, upi: 0, cc: 0 },
    balanceStatus: 'pending', balanceSplit: { cash: 0, upi: 0, cc: 0, cheque: 0 }, balanceReceivedDate: today(),
    notes: '',
  };
}

export function DayPicnicPage() {
  const { data: settings } = useSettings();
  const [filter, setFilter] = useState({ from: '', to: '' });
  const { data: entries } = useDayEntries(filter.from || filter.to ? filter : undefined);
  const [editing, setEditing] = useState<DayEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (!settings) return <div className="text-inkdim text-sm">Loading…</div>;

  const rows = (entries ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-2.5">
        <div>
          <h2 className="text-[22px] font-semibold m-0">Day Picnic Package</h2>
          <div className="text-inkdim text-sm">Pax count drives meals & revenue automatically</div>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ New Entry</Button>
      </div>

      {showForm && (
        <DayForm
          key={editing?.id ?? 'new'}
          settings={settings}
          initial={editing}
          onDone={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <Card className="p-4">
        <div className="flex gap-2.5 mb-3 flex-wrap">
          <Field label="From"><Input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} /></Field>
          <Field label="To"><Input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} /></Field>
          <Button variant="secondary" size="sm" className="self-end" onClick={() => setFilter({ from: '', to: '' })}>Clear</Button>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-8 text-inkdim text-sm">No day picnic entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
                  <th className="py-2 px-2">Date</th><th className="py-2 px-2">Package</th><th className="py-2 px-2">Pax</th>
                  <th className="py-2 px-2">Meals B/L/H/D</th><th className="py-2 px-2">Amount</th><th className="py-2 px-2">Balance</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-none">
                    <td className="py-2 px-2">{r.date}{r.walkIn && <Pill tone="info">walk-in</Pill>}</td>
                    <td className="py-2 px-2">{r.packageLabel}</td>
                    <td className="py-2 px-2 mono">{r.totalPax}</td>
                    <td className="py-2 px-2 mono">{r.meals.B}/{r.meals.L}/{r.meals.H}/{r.meals.D}</td>
                    <td className="py-2 px-2 mono text-right">
                      {fmt(r.amount)}
                      {r.discountAmount > 0 && <span className="block text-[10px] text-inkdim font-normal">−{fmt(r.discountAmount)} disc.</span>}
                    </td>
                    <td className="py-2 px-2">
                      <Pill tone={r.balance.status}>{r.balance.status}</Pill>{' '}
                      <span className="mono text-xs">{fmt(r.balance.amount)}</span>
                    </td>
                    <td className="py-2 px-2">
                      <RowActions entry={r} onEdit={() => { setEditing(r); setShowForm(true); }} />
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

function RowActions({ entry, onEdit }: { entry: DayEntry; onEdit: () => void }) {
  const del = useDeleteDayEntry();
  return (
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="p-2.5 -m-1 text-inkdim hover:bg-surface2 rounded" title="Edit">✎</button>
      <button
        onClick={() => { if (confirm('Delete this entry?')) del.mutate(entry.id, { onSuccess: () => toast('Entry deleted'), onError: (err) => toast(apiErrorMessage(err)) }); }}
        className="p-2.5 -m-1 text-inkdim hover:bg-surface2 rounded"
        title="Delete"
      >
        🗑
      </button>
    </div>
  );
}

function DayForm({
  settings, initial, onDone,
}: { settings: NonNullable<ReturnType<typeof useSettings>['data']>; initial: DayEntry | null; onDone: () => void }) {
  const packages = settings.day_packages.items;
  const tents = settings.tent_types.items;
  const [draft, setDraft] = useState<Draft>(() =>
    initial
      ? {
          date: initial.date, packageId: initial.packageId, walkIn: initial.walkIn, tentId: initial.tentId,
          paxBelow5: initial.paxBelow5, pax5to10: initial.pax5to10, paxAbove10: initial.paxAbove10,
          discountAmount: initial.discountAmount,
          advanceAmount: initial.advance.amount, advanceDate: initial.advance.date ?? today(), advanceSplit: initial.advance.split,
          partialAmount: initial.partial.amount, partialDate: initial.partial.date ?? today(), partialSplit: initial.partial.split,
          balanceStatus: initial.balance.status, balanceSplit: initial.balance.split, balanceReceivedDate: initial.balance.receivedDate ?? today(),
          notes: initial.notes,
        }
      : blankDraft(packages[0]?.id ?? ''),
  );

  const pkg = packages.find((p) => p.id === draft.packageId) ?? packages[0];
  const computed = useMemo(
    () => computeDayPicnic(draft, pkg, settings.general.walkInSurcharge),
    [draft, pkg, settings.general.walkInSurcharge],
  );
  const balanceDue = Math.max(0, computed.amount - draft.advanceAmount - draft.partialAmount);

  const create = useCreateDayEntry();
  const update = useUpdateDayEntry();
  const saving = create.isPending || update.isPending;

  const submit = async () => {
    if (computed.totalPax === 0) { toast('Add at least 1 pax'); return; }
    const tent = tents.find((t) => t.id === draft.tentId);
    const payload = {
      date: draft.date, packageId: draft.packageId, walkIn: draft.walkIn, tentId: draft.tentId, tentName: tent?.name ?? '',
      paxBelow5: draft.paxBelow5, pax5to10: draft.pax5to10, paxAbove10: draft.paxAbove10,
      discountAmount: draft.discountAmount,
      advance: { amount: draft.advanceAmount, date: draft.advanceDate, split: draft.advanceSplit },
      partial: { amount: draft.partialAmount, date: draft.partialDate, split: draft.partialSplit },
      balance:
        draft.balanceStatus === 'received'
          ? { status: 'received', split: draft.balanceSplit, receivedDate: draft.balanceReceivedDate }
          : { status: 'pending' },
      notes: draft.notes,
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, payload });
      else await create.mutateAsync(payload);
      toast(initial ? 'Entry updated' : 'Entry saved');
      onDone();
    } catch (err) {
      toast(apiErrorMessage(err));
    }
  };

  return (
    <Card className="p-4 flex flex-col gap-3.5">
      <h3 className="text-base font-semibold m-0">{initial ? 'Edit' : 'New'} Day Picnic Entry</h3>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Date"><Input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} /></Field>
        <Field label="Package">
          <Select value={draft.packageId} onChange={(e) => setDraft((d) => ({ ...d, packageId: e.target.value }))}>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.label} — {fmt(p.rate)}</option>)}
          </Select>
        </Field>
        <Field label="Tent / Venue (optional)">
          <Select value={draft.tentId} onChange={(e) => setDraft((d) => ({ ...d, tentId: e.target.value }))}>
            <option value="">—</option>
            {tents.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={draft.walkIn} onChange={(e) => setDraft((d) => ({ ...d, walkIn: e.target.checked }))} />
        Walk-in guest (+{fmt(settings.general.walkInSurcharge)}/pax)
      </label>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stepper label="Pax Below 5 yrs (free)" value={draft.paxBelow5} onChange={(v) => setDraft((d) => ({ ...d, paxBelow5: v }))} />
        <Stepper label="Pax 5-10 yrs (70%)" value={draft.pax5to10} onChange={(v) => setDraft((d) => ({ ...d, pax5to10: v }))} />
        <Stepper label="Pax Above 10 (full)" value={draft.paxAbove10} onChange={(v) => setDraft((d) => ({ ...d, paxAbove10: v }))} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['B', 'L', 'H', 'D'] as const).map((k) => (
          <div key={k} className={`bg-surface border border-border rounded-xl p-2.5 ${pkg.meals[k] ? '' : 'opacity-35'}`}>
            <div className="text-[11.5px] uppercase text-inkdim font-semibold">{MEAL_LABEL[k]}</div>
            <div className="mono text-lg font-semibold">{computed.meals[k]}</div>
          </div>
        ))}
      </div>

      <Field label="Discount (₹)">
        <Input type="number" min={0} value={draft.discountAmount} onChange={(e) => setDraft((d) => ({ ...d, discountAmount: Number(e.target.value) || 0 }))} />
      </Field>

      <div className="bg-accentsoft rounded-xl p-3.5 flex justify-between items-center">
        <div>
          <div className="text-[11.5px] font-bold uppercase text-accentstrong">Total Amount</div>
          {computed.discountAmount > 0 ? (
            <>
              <div className="text-xs text-inkdim">Gross {fmt(computed.grossAmount)} − Discount {fmt(computed.discountAmount)}</div>
              <div className="mono text-2xl font-bold">{fmt(computed.amount)}</div>
            </>
          ) : (
            <div className="mono text-2xl font-bold">{fmt(computed.amount)}</div>
          )}
        </div>
        <div className="text-xs text-inkdim">{computed.totalPax} pax</div>
      </div>

      <h3 className="text-sm font-semibold m-0">Advance Payment</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Advance Amount">
          <Input type="number" min={0} value={draft.advanceAmount} onChange={(e) => setDraft((d) => ({ ...d, advanceAmount: Number(e.target.value) || 0 }))} />
        </Field>
        <Field label="Advance Date">
          <Input type="date" value={draft.advanceDate} onChange={(e) => setDraft((d) => ({ ...d, advanceDate: e.target.value }))} />
        </Field>
      </div>
      {draft.advanceAmount > 0 && (
        <SplitEditor target={draft.advanceAmount} value={draft.advanceSplit} onChange={(s) => setDraft((d) => ({ ...d, advanceSplit: s }))} />
      )}

      <h3 className="text-sm font-semibold m-0">Partial Payment <span className="text-inkdim font-normal text-xs">(optional — a second payment before the final balance, e.g. paid in full on the day)</span></h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Partial Amount">
          <Input type="number" min={0} value={draft.partialAmount} onChange={(e) => setDraft((d) => ({ ...d, partialAmount: Number(e.target.value) || 0 }))} />
        </Field>
        <Field label="Partial Payment Date">
          <Input type="date" value={draft.partialDate} onChange={(e) => setDraft((d) => ({ ...d, partialDate: e.target.value }))} />
        </Field>
      </div>
      {draft.partialAmount > 0 && (
        <SplitEditor target={draft.partialAmount} value={draft.partialSplit} onChange={(s) => setDraft((d) => ({ ...d, partialSplit: s }))} />
      )}

      <h3 className="text-sm font-semibold m-0">Balance Payment</h3>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-sm font-semibold">
          <input type="radio" checked={draft.balanceStatus === 'pending'} onChange={() => setDraft((d) => ({ ...d, balanceStatus: 'pending' }))} /> Pending
        </label>
        <label className="flex items-center gap-1.5 text-sm font-semibold">
          <input type="radio" checked={draft.balanceStatus === 'received'} onChange={() => setDraft((d) => ({ ...d, balanceStatus: 'received' }))} /> Received now
        </label>
      </div>
      {draft.balanceStatus === 'pending' ? (
        <div className="bg-surface border border-border rounded-xl p-3">
          <div className="text-[11.5px] uppercase text-inkdim font-semibold">Balance Due</div>
          <div className="mono text-lg font-semibold">{fmt(balanceDue)}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Received Date">
            <Input type="date" value={draft.balanceReceivedDate} onChange={(e) => setDraft((d) => ({ ...d, balanceReceivedDate: e.target.value }))} />
          </Field>
          <SplitEditor target={balanceDue} value={draft.balanceSplit} onChange={(s) => setDraft((d) => ({ ...d, balanceSplit: s }))} includeCheque />
        </div>
      )}

      <Field label="Notes / Guest Name">
        <textarea
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[16px]"
          rows={2}
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{initial ? 'Save Changes' : 'Save Entry'}</Button>
      </div>
    </Card>
  );
}
