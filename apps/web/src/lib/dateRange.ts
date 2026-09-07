export type RangePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function computeRange(preset: RangePreset, custom?: { from: string; to: string }): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();

  if (preset === 'today') { const t = iso(now); return { from: t, to: t }; }
  if (preset === 'week') {
    const dow = (now.getDay() + 6) % 7;
    const mon = new Date(now); mon.setDate(d - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: iso(mon), to: iso(sun) };
  }
  if (preset === 'month') return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
  if (preset === 'year') return { from: iso(new Date(y, 0, 1)), to: iso(new Date(y, 11, 31)) };
  return custom ?? { from: iso(now), to: iso(now) };
}
