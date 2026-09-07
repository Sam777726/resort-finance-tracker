import clsx from 'clsx';

export function Pill({ tone, children }: { tone: 'received' | 'pending' | 'info'; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold uppercase tracking-wide',
        tone === 'received' && 'bg-successsoft text-success',
        tone === 'pending' && 'bg-dangersoft text-danger',
        tone === 'info' && 'bg-accentsoft text-accentstrong',
      )}
    >
      {children}
    </span>
  );
}
