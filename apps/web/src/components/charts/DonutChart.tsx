import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = ['#3F6B3F', '#B9720F', '#A9432A', '#5B7FA6', '#8A6BB1', '#4E9C8F', '#C97AAE', '#7C8A4A', '#C4562E', '#527A9E', '#9C6F3F', '#6B8E4E'];

export function DonutChart({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div className="bg-surface border border-border rounded-xl shadow p-3.5 h-[300px] flex flex-col">
      <div className="text-sm font-semibold text-center mb-1">{title}</div>
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-inkdim text-sm">No data in range</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filtered} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
              {filtered.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
