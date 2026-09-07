import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StoreSale } from '../lib/entryTypes';

export function useStoreSales(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['income-store', range],
    queryFn: async () => (await api.get<StoreSale[]>('/income/store', { params: range })).data,
  });
}

export function useCreateStoreSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => (await api.post<StoreSale>('/income/store', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-store'] }),
  });
}

export function useDeleteStoreSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/income/store/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income-store'] }),
  });
}
