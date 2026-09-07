import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold uppercase tracking-wide text-inkdim">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}
