import { useMemo } from 'react';
import { useDayEntries } from './useDayEntries';
import { useOvernightEntries } from './useOvernightEntries';
import { useStoreSales } from './useStoreSales';
import { useExpenses } from './useExpenses';
import type { TrendPoint } from '../components/charts/TrendChart';

/** Client-side day-bucketed trend, built from the same list endpoints the
 * Day Picnic / Overnight / Store / Expenses pages already use — no
 * dedicated time-series endpoint needed for a resort-scale row count. */
export function useTrendSeries(from: string, to: string) {
  const day = useDayEntries({ from, to });
  const overnight = useOvernightEntries({ from, to });
  const store = useStoreSales({ from, to });
  const expenses = useExpenses({ from, to });

  const isLoading = day.isLoading || overnight.isLoading || store.isLoading || expenses.isLoading;

  const data = useMemo<TrendPoint[]>(() => {
    if (!day.data || !overnight.data || !store.data || !expenses.data) return [];

    const days: string[] = [];
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end && days.length < 92) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    return days.map((d) => {
      const income =
        day.data.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0) +
        overnight.data.filter((e) => e.checkIn === d).reduce((s, e) => s + e.totalAmount, 0) +
        store.data.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0);
      const expense = expenses.data.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0);
      const label = new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return { label, income, expense };
    });
  }, [day.data, overnight.data, store.data, expenses.data, from, to]);

  return { data, isLoading };
}
