import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

export function TrendChart({ title, data }: { title: string; data: TrendPoint[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow p-3.5 h-[300px] flex flex-col">
      <div className="text-sm font-semibold text-center mb-1">{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-dim)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-dim)' }} width={44} />
          <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="income" name="Income" stroke="#3F6B3F" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" name="Expense" stroke="#A9432A" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
