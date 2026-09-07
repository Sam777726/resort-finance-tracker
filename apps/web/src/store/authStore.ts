import { create } from 'zustand';

export interface AuthedUser {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthedUser | null;
  setSession: (tokens: { accessToken: string; refreshToken: string }, user: AuthedUser) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
}

const REFRESH_KEY = 'cd_refresh';
const USER_KEY = 'cd_user';

/** Access token lives ONLY in memory (this store) — never touches
 * localStorage, so an XSS payload reading localStorage can't steal it, and
 * it's gone the instant the tab closes. The refresh token (longer-lived)
 * is persisted so a reload doesn't force a re-login.
 *
 * Tradeoff worth naming: a production deployment would set the refresh
 * token as an httpOnly, Secure, SameSite cookie from the API instead —
 * that closes the XSS-exfiltration vector this localStorage read leaves
 * open. That needs the API and web app to share a cookie-eligible origin
 * (a reverse proxy, or a shared parent domain), which doesn't fit this
 * project's "docker compose up and it just works, two separate dev ports"
 * shape as cleanly. Kept as a returned token + localStorage here so the
 * auth flow stays easy to inspect and replay from the Swagger UI too. */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_KEY),
  user: JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),

  setSession: (tokens, user) => {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => {
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
