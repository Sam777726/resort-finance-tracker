import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ExpenseEntry } from '../lib/entryTypes';

export function useExpenses(range?: { from?: string; to?: string; category?: string }) {
  return useQuery({
    queryKey: ['expenses', range],
    queryFn: async () => (await api.get<ExpenseEntry[]>('/expenses', { params: range })).data,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => (await api.post<ExpenseEntry>('/expenses', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/expenses/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
