import clsx from 'clsx';
import type { RangePreset } from '../../lib/dateRange';
import { Input } from './Field';

const OPTIONS: Array<{ key: RangePreset; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export function RangeBar({
  preset, onPresetChange, custom, onCustomChange, allowCustom = false,
}: {
  preset: RangePreset;
  onPresetChange: (p: RangePreset) => void;
  custom?: { from: string; to: string };
  onCustomChange?: (c: { from: string; to: string }) => void;
  allowCustom?: boolean;
}) {
  const options = allowCustom ? [...OPTIONS, { key: 'custom' as const, label: 'Custom' }] : OPTIONS;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1.5 flex-wrap items-center">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onPresetChange(o.key)}
            className={clsx(
              'px-3 py-1.5 rounded-lg border text-xs font-semibold',
              preset === o.key ? 'bg-accent text-accentink border-accent' : 'bg-surface text-inkdim border-border',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && custom && onCustomChange && (
        <div className="flex gap-2.5">
          <Input type="date" value={custom.from} onChange={(e) => onCustomChange({ ...custom, from: e.target.value })} />
          <Input type="date" value={custom.to} onChange={(e) => onCustomChange({ ...custom, to: e.target.value })} />
        </div>
      )}
    </div>
  );
}
