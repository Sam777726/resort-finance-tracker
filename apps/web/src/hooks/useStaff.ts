import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StaffMember {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get<StaffMember[]>('/staff')).data,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; role: 'admin' | 'staff'; pin: string }) =>
      (await api.post('/staff', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useResetStaffPin() {
  return useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => (await api.patch(`/staff/${id}/pin`, { pin })).data,
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/staff/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
