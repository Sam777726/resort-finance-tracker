import { useState } from 'react';
import { computeRange, type RangePreset } from '../lib/dateRange';
import { useRecomputeReport, useReportSummary } from '../hooks/useReports';
import { Card, Tile } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RangeBar } from '../components/ui/RangeBar';
import { DonutChart } from '../components/charts/DonutChart';
import { toast } from '../store/toastStore';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function toCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [custom, setCustom] = useState({ from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) });
  const { from, to } = computeRange(preset, custom);
  const { data: summary, isLoading, refetch } = useReportSummary(from, to);
  const recompute = useRecomputeReport();

  if (isLoading || !summary) return <div className="text-inkdim text-sm">Loading…</div>;

  const profit = summary.income.grandTotal - summary.expenses.total;
  const foodCostPct = summary.income.foodCostValue > 0 ? (summary.expenses.kitchenTotal / summary.income.foodCostValue) * 100 : 0;

  const exportCsv = () => {
    const rows = [
      { metric: 'Range', value: `${from} to ${to}` },
      { metric: 'Total Income', value: summary.income.grandTotal },
      { metric: 'Total Expenses', value: summary.expenses.total },
      { metric: 'Net Profit', value: profit },
      { metric: 'Room Revenue', value: summary.income.roomRevenue },
      { metric: 'Food Value', value: summary.income.foodCostValue },
      ...Object.entries(summary.expenses.byCategory).map(([k, v]) => ({ metric: `Expense: ${k}`, value: v })),
      { metric: 'Cash', value: summary.paymentTotals.cash },
      { metric: 'UPI', value: summary.paymentTotals.upi },
      { metric: 'Credit Card', value: summary.paymentTotals.cc },
      { metric: 'Cheque', value: summary.paymentTotals.cheque },
    ];
    downloadCsv(`campdilly_report_${from}_to_${to}.csv`, toCsv(rows));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-2.5">
        <div>
          <h2 className="text-[22px] font-semibold m-0">Reports</h2>
          <div className="text-inkdim text-sm">{from} – {to}{summary.cached && <span className="text-accentstrong"> · served from cache</span>}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary" size="sm"
            onClick={async () => { await recompute.mutateAsync({ from, to }); toast('Recompute queued — refresh in a moment'); setTimeout(refetch, 1500); }}
          >
            Recompute (background job)
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <Card className="p-4">
        <RangeBar preset={preset} onPresetChange={setPreset} custom={custom} onCustomChange={setCustom} allowCustom />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Total Income" value={fmt(summary.income.grandTotal)} tone="accent" />
        <Tile label="Total Expenses" value={fmt(summary.expenses.total)} tone="warn" />
        <Tile label="Net Profit" value={fmt(profit)} tone={profit >= 0 ? 'accent' : 'warn'} />
        <Tile label="Food Cost %" value={summary.income.foodCostValue ? `${foodCostPct.toFixed(1)}%` : '—'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mt-0 mb-2.5">Income Breakdown</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="py-1">Day Picnic ({summary.income.dayCount})</td><td className="py-1 text-right mono">{fmt(summary.income.dayTotal)}</td></tr>
              <tr><td className="py-1">Overnight ({summary.income.overnightCount})</td><td className="py-1 text-right mono">{fmt(summary.income.overnightTotal)}</td></tr>
              <tr><td className="py-1 pl-4 text-inkdim">↳ Room Revenue</td><td className="py-1 text-right mono">{fmt(summary.income.roomRevenue)}</td></tr>
              <tr><td className="py-1 pl-4 text-inkdim">↳ Food Value</td><td className="py-1 text-right mono">{fmt(summary.income.foodCostValue)}</td></tr>
              <tr><td className="py-1">Store Sales ({summary.income.storeCount})</td><td className="py-1 text-right mono">{fmt(summary.income.storeTotal)}</td></tr>
              <tr className="font-bold border-t border-border"><td className="py-1">Total</td><td className="py-1 text-right mono">{fmt(summary.income.grandTotal)}</td></tr>
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mt-0 mb-2.5">Payment Method Totals</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="py-1">Cash</td><td className="py-1 text-right mono">{fmt(summary.paymentTotals.cash)}</td></tr>
              <tr><td className="py-1">UPI</td><td className="py-1 text-right mono">{fmt(summary.paymentTotals.upi)}</td></tr>
              <tr><td className="py-1">Credit Card</td><td className="py-1 text-right mono">{fmt(summary.paymentTotals.cc)}</td></tr>
              <tr><td className="py-1">Cheque</td><td className="py-1 text-right mono">{fmt(summary.paymentTotals.cheque)}</td></tr>
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mt-0 mb-2.5">Expenses by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-inkdim border-b border-border">
                <th className="py-2">Category</th><th className="py-2">Amount</th><th className="py-2">% of Expenses</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.expenses.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <tr key={k} className="border-b border-border last:border-none">
                  <td className="py-1.5">{k}</td>
                  <td className="py-1.5 mono">{fmt(v)}</td>
                  <td className="py-1.5 mono">{summary.expenses.total ? ((v / summary.expenses.total) * 100).toFixed(1) : '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <DonutChart title="Income by Source" data={[
          { name: 'Day Picnic', value: summary.income.dayTotal },
          { name: 'Overnight', value: summary.income.overnightTotal },
          { name: 'Store', value: summary.income.storeTotal },
        ]} />
        <DonutChart title="Expenses by Category" data={Object.entries(summary.expenses.byCategory).map(([name, value]) => ({ name, value }))} />
      </div>
    </div>
  );
}
