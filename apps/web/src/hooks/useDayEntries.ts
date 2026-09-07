import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DayEntry } from '../lib/entryTypes';

export function useDayEntries(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['income-day', range],
    queryFn: async () => (await api.get<DayEntry[]>('/income/day', { params: range })).data,
  });
}

export function useCreateDayEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => (await api.post<DayEntry>('/income/day', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-day'] }),
  });
}

export function useUpdateDayEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) =>
      (await api.patch<DayEntry>(`/income/day/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-day'] }),
  });
}

export function useMarkDayBalanceReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) =>
      (await api.patch<DayEntry>(`/income/day/${id}/balance`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-day'] }),
  });
}

export function useDeleteDayEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/income/day/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-day'] }),
  });
}
