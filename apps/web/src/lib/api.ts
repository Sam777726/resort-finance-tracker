import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single in-flight refresh promise: if five requests 401 at once (e.g. a
// dashboard firing parallel queries right as the access token expires),
// they all await the SAME refresh call instead of racing five separate
// ones and rotating the refresh token five times.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setSession, user, clear } = useAuthStore.getState();
  if (!refreshToken) { clear(); throw new Error('No refresh token'); }

  try {
    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
    setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, user!);
    return data.accessToken;
  } catch (err) {
    clear();
    throw err;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
        const newToken = await refreshPromise;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // fall through to reject — ProtectedRoute will redirect to /login
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg ?? fallback;
  }
  return fallback;
}
