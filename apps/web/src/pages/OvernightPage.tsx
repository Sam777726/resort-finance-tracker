import { useMemo, useState } from 'react';
import { computeOvernight } from '@camp-dilly/shared';
import type { PaymentSplit } from '@camp-dilly/shared';
import { useSettings } from '../hooks/useSettings';
import { useCreateOvernightEntry, useDeleteOvernightEntry, useOvernightEntries, useUpdateOvernightEntry } from '../hooks/useOvernightEntries';
import type { OvernightEntry } from '../lib/entryTypes';
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
  checkIn: string;
  nights: number;
  unitId: string;
  manualExtra: boolean;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
  extraBelow5: number;
  extra5to10: number;
  extraAbove10: number;
  advanceAmount: number;
  advanceDate: string;
  advanceSplit: PaymentSplit;
  balanceStatus: 'pending' | 'received';
  balanceSplit: PaymentSplit;
  balanceReceivedDate: string;
  notes: string;
}

function blankDraft(defaultUnitId: string): Draft {
  return {
    checkIn: today(), nights: 1, unitId: defaultUnitId, manualExtra: false,
    paxBelow5: 0, pax5to10: 0, paxAbove10: 0, extraBelow5: 0, extra5to10: 0, extraAbove10: 0,
    advanceAmount: 0, advanceDate: today(), advanceSplit: { cash: 0, upi: 0, cc: 0 },
    balanceStatus: 'pending', balanceSplit: { cash: 0, upi: 0, cc: 0, cheque: 0 }, balanceReceivedDate: today(),
    notes: '',
  };
}

export function OvernightPage() {
  const { data: settings } = useSettings();
  const [filter, setFilter] = useState({ from: '', to: '' });
  const { data: entries } = useOvernightEntries(filter.from || filter.to ? filter : undefined);
  const [editing, setEditing] = useState<OvernightEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (!settings) return <div className="text-inkdim text-sm">Loading…</div>;
  const rows = (entries ?? []).slice().sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-2.5">
        <div>
          <h2 className="text-[22px] font-semibold m-0">Overnight Package</h2>
          <div className="text-inkdim text-sm">Meals and food-cost bifurcation calculated automatically</div>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ New Entry</Button>
      </div>

      {showForm && (
        <OvernightForm key={editing?.id ?? 'new'} settings={settings} initial={editing} onDone={() => { setShowForm(false); setEditing(null); }} />
      )}

      <Card className="p-4">
        <div className="flex gap-2.5 mb-3 flex-wrap">
          <Input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} />
          <Button variant="secondary" size="sm" onClick={() => setFilter({ from: '', to: '' })}>Clear</Button>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-8 text-inkdim text-sm">No overnight entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
                  <th className="py-2 px-2">Check-in</th><th className="py-2 px-2">Unit</th><th className="py-2 px-2">Nights</th>
                  <th className="py-2 px-2">Pax</th><th className="py-2 px-2">Total</th><th className="py-2 px-2">Room Rev</th>
                  <th className="py-2 px-2">Balance</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-none">
                    <td className="py-2 px-2">{r.checkIn}</td>
                    <td className="py-2 px-2">{r.unitName}</td>
                    <td className="py-2 px-2 mono">{r.nights}</td>
                    <td className="py-2 px-2 mono">{r.totalPax}</td>
                    <td className="py-2 px-2 mono text-right">{fmt(r.totalAmount)}</td>
                    <td className="py-2 px-2 mono text-right">{fmt(r.roomRevenue)}</td>
                    <td className="py-2 px-2">
                      <Pill tone={r.balance.status}>{r.balance.status}</Pill>{' '}
                      <span className="mono text-xs">{fmt(r.balance.amount)}</span>
                    </td>
                    <td className="py-2 px-2"><RowActions entry={r} onEdit={() => { setEditing(r); setShowForm(true); }} /></td>
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

function RowActions({ entry, onEdit }: { entry: OvernightEntry; onEdit: () => void }) {
  const del = useDeleteOvernightEntry();
  return (
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="p-1 text-inkdim hover:bg-surface2 rounded" title="Edit">✎</button>
      <button
        onClick={() => { if (confirm('Delete this entry?')) del.mutate(entry.id, { onSuccess: () => toast('Entry deleted') }); }}
        className="p-1 text-inkdim hover:bg-surface2 rounded"
        title="Delete"
      >
        🗑
      </button>
    </div>
  );
}

function OvernightForm({
  settings, initial, onDone,
}: { settings: NonNullable<ReturnType<typeof useSettings>['data']>; initial: OvernightEntry | null; onDone: () => void }) {
  const units = settings.tent_types.items;
  const [draft, setDraft] = useState<Draft>(() =>
    initial
      ? {
          checkIn: initial.checkIn, nights: initial.nights, unitId: initial.unitId, manualExtra: initial.manualExtra,
          paxBelow5: initial.paxBelow5, pax5to10: initial.pax5to10, paxAbove10: initial.paxAbove10,
          extraBelow5: initial.extraBelow5, extra5to10: initial.extra5to10, extraAbove10: initial.extraAbove10,
          advanceAmount: initial.advance.amount, advanceDate: initial.advance.date ?? today(), advanceSplit: initial.advance.split,
          balanceStatus: initial.balance.status, balanceSplit: initial.balance.split, balanceReceivedDate: initial.balance.receivedDate ?? today(),
          notes: initial.notes,
        }
      : blankDraft(units[0]?.id ?? ''),
  );

  const unit = units.find((u) => u.id === draft.unitId) ?? units[0];
  const computed = useMemo(
    () => computeOvernight(draft, unit, settings.extra_person_rates, settings.general.foodCostPerHead),
    [draft, unit, settings],
  );
  const balanceDue = Math.max(0, computed.totalAmount - draft.advanceAmount);

  const create = useCreateOvernightEntry();
  const update = useUpdateOvernightEntry();
  const saving = create.isPending || update.isPending;

  const submit = async () => {
    if (computed.totalPax === 0) { toast('Add at least 1 pax'); return; }
    const payload = {
      checkIn: draft.checkIn, nights: computed.nights, unitId: draft.unitId,
      manualExtra: draft.manualExtra, paxBelow5: draft.paxBelow5, pax5to10: draft.pax5to10, paxAbove10: draft.paxAbove10,
      extraBelow5: computed.extraBelow5, extra5to10: computed.extra5to10, extraAbove10: computed.extraAbove10,
      advance: { amount: draft.advanceAmount, date: draft.advanceDate, split: draft.advanceSplit },
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
      <h3 className="text-base font-semibold m-0">{initial ? 'Edit' : 'New'} Overnight Entry</h3>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Check-in Date"><Input type="date" value={draft.checkIn} onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))} /></Field>
        <Field label="Nights"><Input type="number" min={1} value={draft.nights} onChange={(e) => setDraft((d) => ({ ...d, nights: Number(e.target.value) || 1 }))} /></Field>
        <Field label="Room / Tent Type">
          <Select value={draft.unitId} onChange={(e) => setDraft((d) => ({ ...d, unitId: e.target.value }))}>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name} (cap {u.capacity}) — {u.rate ? fmt(u.rate) : 'rate not set'}</option>)}
          </Select>
        </Field>
      </div>
      {unit && !unit.rate && <div className="text-danger text-xs">⚠ Base rate not set for this unit — set it in Settings → Tent/Room Types.</div>}

      <div className="grid sm:grid-cols-3 gap-3">
        <Stepper label="Pax Below 5 yrs" value={draft.paxBelow5} onChange={(v) => setDraft((d) => ({ ...d, paxBelow5: v }))} />
        <Stepper label="Pax 5-10 yrs" value={draft.pax5to10} onChange={(v) => setDraft((d) => ({ ...d, pax5to10: v }))} />
        <Stepper label="Pax Above 10 yrs" value={draft.paxAbove10} onChange={(v) => setDraft((d) => ({ ...d, paxAbove10: v }))} />
      </div>
      <div className="text-xs text-inkdim">
        First <b>{unit?.capacity ?? 0}</b> pax are included in the base rate; anyone beyond that is charged as extra person
        (Below5 free, 5-10 yrs {fmt(settings.extra_person_rates.age5to10)}, Above10 {fmt(settings.extra_person_rates.above10)}, per night).
      </div>
      <label className="flex items-center gap-1.5 text-xs font-semibold">
        <input type="checkbox" checked={draft.manualExtra} onChange={(e) => setDraft((d) => ({ ...d, manualExtra: e.target.checked }))} />
        Manually adjust which pax are &quot;extra&quot;
      </label>
      {draft.manualExtra && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Extra Below5"><Input type="number" min={0} value={draft.extraBelow5} onChange={(e) => setDraft((d) => ({ ...d, extraBelow5: Number(e.target.value) || 0 }))} /></Field>
          <Field label="Extra 5-10"><Input type="number" min={0} value={draft.extra5to10} onChange={(e) => setDraft((d) => ({ ...d, extra5to10: Number(e.target.value) || 0 }))} /></Field>
          <Field label="Extra Above10"><Input type="number" min={0} value={draft.extraAbove10} onChange={(e) => setDraft((d) => ({ ...d, extraAbove10: Number(e.target.value) || 0 }))} /></Field>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['B', 'L', 'H', 'D'] as const).map((k) => (
          <div key={k} className="bg-surface border border-border rounded-xl p-2.5">
            <div className="text-[11.5px] uppercase text-inkdim font-semibold">{MEAL_LABEL[k]}</div>
            <div className="mono text-lg font-semibold">{computed.meals[k]}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-2.5"><div className="text-[11.5px] uppercase text-inkdim font-semibold">Base Amount</div><div className="mono font-semibold">{fmt(computed.baseAmount)}</div></div>
        <div className="bg-surface border border-border rounded-xl p-2.5"><div className="text-[11.5px] uppercase text-inkdim font-semibold">Extra Person Charge</div><div className="mono font-semibold">{fmt(computed.extraCharge)}</div></div>
        <div className="bg-accentsoft rounded-xl p-2.5"><div className="text-[11.5px] uppercase text-accentstrong font-semibold">Total Amount</div><div className="mono font-semibold">{fmt(computed.totalAmount)}</div></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-2.5"><div className="text-[11.5px] uppercase text-inkdim font-semibold">Food Cost Value (₹{settings.general.foodCostPerHead}/head)</div><div className="mono font-semibold">{fmt(computed.foodCostValue)}</div></div>
        <div className="bg-surface border border-border rounded-xl p-2.5"><div className="text-[11.5px] uppercase text-inkdim font-semibold">Net Room Revenue</div><div className="mono font-semibold">{fmt(computed.roomRevenue)}</div></div>
      </div>

      <h3 className="text-sm font-semibold m-0">Advance Payment</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Advance Amount"><Input type="number" min={0} value={draft.advanceAmount} onChange={(e) => setDraft((d) => ({ ...d, advanceAmount: Number(e.target.value) || 0 }))} /></Field>
        <Field label="Advance Date"><Input type="date" value={draft.advanceDate} onChange={(e) => setDraft((d) => ({ ...d, advanceDate: e.target.value }))} /></Field>
      </div>
      {draft.advanceAmount > 0 && <SplitEditor target={draft.advanceAmount} value={draft.advanceSplit} onChange={(s) => setDraft((d) => ({ ...d, advanceSplit: s }))} />}

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
          <Field label="Received Date"><Input type="date" value={draft.balanceReceivedDate} onChange={(e) => setDraft((d) => ({ ...d, balanceReceivedDate: e.target.value }))} /></Field>
          <SplitEditor target={balanceDue} value={draft.balanceSplit} onChange={(s) => setDraft((d) => ({ ...d, balanceSplit: s }))} includeCheque />
        </div>
      )}

      <Field label="Notes / Guest Name">
        <textarea className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[16px]" rows={2} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{initial ? 'Save Changes' : 'Save Entry'}</Button>
      </div>
    </Card>
  );
}
