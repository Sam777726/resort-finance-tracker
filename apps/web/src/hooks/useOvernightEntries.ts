import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { OvernightEntry } from '../lib/entryTypes';

export function useOvernightEntries(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['income-overnight', range],
    queryFn: async () => (await api.get<OvernightEntry[]>('/income/overnight', { params: range })).data,
  });
}

export function useCreateOvernightEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => (await api.post<OvernightEntry>('/income/overnight', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-overnight'] }),
  });
}

export function useUpdateOvernightEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) =>
      (await api.patch<OvernightEntry>(`/income/overnight/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-overnight'] }),
  });
}

export function useMarkOvernightBalanceReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) =>
      (await api.patch<OvernightEntry>(`/income/overnight/${id}/balance`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-overnight'] }),
  });
}

export function useDeleteOvernightEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/income/overnight/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-overnight'] }),
  });
}
