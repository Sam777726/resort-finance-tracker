import { useState } from 'react';
import { Link } from 'react-router-dom';
import { computeRange, type RangePreset } from '../lib/dateRange';
import { useReportSummary } from '../hooks/useReports';
import { useTrendSeries } from '../hooks/useTrendSeries';
import { Tile } from '../components/ui/Card';
import { RangeBar } from '../components/ui/RangeBar';
import { DonutChart } from '../components/charts/DonutChart';
import { TrendChart } from '../components/charts/TrendChart';
import { PendingList } from '../components/PendingList';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function DashboardPage() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const { from, to } = computeRange(preset);
  const { data: summary, isLoading } = useReportSummary(from, to);
  const trend = useTrendSeries(from, to);

  if (isLoading || !summary) return <div className="text-inkdim text-sm">Loading dashboard…</div>;

  const { income, expenses, paymentTotals } = summary;
  const profit = income.grandTotal - expenses.total;
  const foodCostPct = income.foodCostValue > 0 ? (expenses.kitchenTotal / income.foodCostValue) * 100 : 0;
  const pendingTotal = summary.pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-2.5">
        <div>
          <h2 className="text-[22px] font-semibold m-0">Dashboard</h2>
          <div className="text-inkdim text-sm">{from} – {to} {summary.cached && <span className="text-accentstrong">(cached)</span>}</div>
        </div>
        <RangeBar preset={preset} onPresetChange={setPreset} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Total Income" value={fmt(income.grandTotal)} sub={`Day ${fmt(income.dayTotal)} · Night ${fmt(income.overnightTotal)} · Store ${fmt(income.storeTotal)}`} tone="accent" />
        <Tile label="Total Expenses" value={fmt(expenses.total)} sub={`${Object.keys(expenses.byCategory).length} categories`} tone="warn" />
        <Tile label="Net Profit" value={fmt(profit)} sub={income.grandTotal ? `${((profit / income.grandTotal) * 100).toFixed(1)}% margin` : '0% margin'} tone={profit >= 0 ? 'accent' : 'warn'} />
        <Tile label="Food Cost %" value={income.foodCostValue ? `${foodCostPct.toFixed(1)}%` : '—'} sub={`Kitchen ${fmt(expenses.kitchenTotal)} / Food Rev ${fmt(income.foodCostValue)}`} />
        <Tile label="Overnight Room Revenue" value={fmt(income.roomRevenue)} sub={`after food value ${fmt(income.foodCostValue)}`} />
        <Tile label="Bookings" value={`${income.dayCount + income.overnightCount}`} sub={`${income.dayCount} day · ${income.overnightCount} overnight`} />
        <Tile label="Pending Payments" value={fmt(pendingTotal)} sub={`${summary.pending.length} entries awaiting`} tone={summary.pending.length ? 'warn' : 'default'} />
        <Tile label="Store Sales" value={fmt(income.storeTotal)} sub={`${income.storeCount} sales`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <TrendChart title="Income vs Expense" data={trend.data} />
        <DonutChart
          title="Expenses by Category"
          data={Object.entries(expenses.byCategory).map(([name, value]) => ({ name, value }))}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <DonutChart
          title="Income by Source"
          data={[
            { name: 'Day Picnic', value: income.dayTotal },
            { name: 'Overnight', value: income.overnightTotal },
            { name: 'Store', value: income.storeTotal },
          ]}
        />
        <DonutChart
          title="Payment Methods"
          data={[
            { name: 'Cash', value: paymentTotals.cash },
            { name: 'UPI', value: paymentTotals.upi },
            { name: 'Credit Card', value: paymentTotals.cc },
            { name: 'Cheque', value: paymentTotals.cheque },
          ]}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-[15px] font-semibold m-0">Pending Payments</h3>
          <Link to="/payments" className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
            View all
          </Link>
        </div>
        <PendingList items={summary.pending.slice(0, 5)} />
      </div>
    </div>
  );
}
