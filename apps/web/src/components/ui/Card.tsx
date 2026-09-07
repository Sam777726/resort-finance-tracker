import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(33,38,28,.07),0_6px_20px_rgba(33,38,28,.07)]', className)}
      {...props}
    />
  );
}

export function Tile({
  label, value, sub, tone = 'default',
}: { label: string; value: string; sub?: string; tone?: 'default' | 'accent' | 'warn' }) {
  return (
    <Card className="p-4">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-inkdim">{label}</div>
      <div className={clsx('mono text-[22px] font-semibold mt-1.5', tone === 'accent' && 'text-accentstrong', tone === 'warn' && 'text-danger')}>
        {value}
      </div>
      {sub && <div className="text-xs text-inkdim mt-1">{sub}</div>}
    </Card>
  );
}
