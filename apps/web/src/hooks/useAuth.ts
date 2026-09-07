import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../lib/api';
import { useAuthStore, type AuthedUser } from '../store/authStore';

interface AuthResponse {
  user: AuthedUser;
  accessToken: string;
  refreshToken: string;
}

export function usePublicStaffRoster() {
  return useQuery({
    queryKey: ['auth-staff-roster'],
    queryFn: async () => (await axios.get<{ id: string; name: string; role: string }[]>('/api/auth/staff')).data,
  });
}

export function useSetupAdmin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (payload: { name: string; pin: string }) => (await axios.post<AuthResponse>('/api/auth/setup', payload)).data,
    onSuccess: (data) => setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user),
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (payload: { staffId: string; pin: string }) => (await axios.post<AuthResponse>('/api/auth/login', payload)).data,
    onSuccess: (data) => setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      try { await api.post('/auth/logout'); } catch { /* best-effort */ }
    },
    onSettled: () => clear(),
  });
}
