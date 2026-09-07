import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DayPackage, ExtraPersonRates, GeneralSettings, TentType } from '@camp-dilly/shared';

export interface SettingsBundle {
  general: GeneralSettings;
  day_packages: { items: DayPackage[] };
  tent_types: { items: TentType[] };
  extra_person_rates: ExtraPersonRates;
  expense_categories: { categories: Record<string, string[]> };
  store_items: { items: Array<{ id: string; name: string; price: number }> };
  category_budgets: { budgets: Record<string, number> };
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<SettingsBundle>('/settings')).data,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof SettingsBundle; value: unknown }) =>
      (await api.put(`/settings/${key}`, { value })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
