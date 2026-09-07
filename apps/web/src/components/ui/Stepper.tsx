export function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold uppercase tracking-wide text-inkdim">{label}</span>
      <div className="flex items-center justify-between gap-2.5 bg-surface2 border border-border rounded-lg px-2 py-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-md border border-border bg-surface text-lg font-bold text-accentstrong active:bg-accentsoft"
        >
          −
        </button>
        <span className="mono font-bold text-base min-w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-md border border-border bg-surface text-lg font-bold text-accentstrong active:bg-accentsoft"
        >
          +
        </button>
      </div>
    </div>
  );
}
