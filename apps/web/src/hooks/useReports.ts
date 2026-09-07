import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ReportSummary {
  range: { from: string; to: string };
  income: {
    dayTotal: number; dayCount: number;
    overnightTotal: number; overnightCount: number; roomRevenue: number; foodCostValue: number;
    storeTotal: number; storeCount: number;
    grandTotal: number;
  };
  expenses: { total: number; byCategory: Record<string, number>; kitchenTotal: number };
  paymentTotals: { cash: number; upi: number; cc: number; cheque: number };
  pending: Array<{ id: string; kind: 'day' | 'overnight'; refDate: string; amount: number }>;
  computedAt: string;
  cached: boolean;
}

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', from, to],
    queryFn: async () => (await api.get<ReportSummary>('/reports/summary', { params: { from, to } })).data,
    enabled: Boolean(from && to),
  });
}

export function useRecomputeReport() {
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) =>
      (await api.post('/reports/recompute', null, { params: { from, to } })).data,
  });
}
