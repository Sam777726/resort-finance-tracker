import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DayPicnicPage } from './pages/DayPicnicPage';
import { OvernightPage } from './pages/OvernightPage';
import { StorePage } from './pages/StorePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

/** On a fresh page load there's a refresh token in localStorage but no
 * access token yet (access tokens live only in memory). Silently exchange
 * it once before rendering routes so a reload doesn't force a re-login. */
function useAuthBootstrap() {
  const { accessToken, refreshToken, user, setSession, clear } = useAuthStore();
  const [ready, setReady] = useState(Boolean(accessToken) || !refreshToken);

  useEffect(() => {
    if (accessToken || !refreshToken) return;
    axios
      .post('/api/auth/refresh', { refreshToken })
      .then(({ data }) => setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, user!))
      .catch(() => clear())
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
}

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

// The API rejects every settings write from a non-admin with a 403 — this
// stops a staff account from reaching a page of inputs that look editable
// but can never actually save, not just hiding the nav link to it.
function RequireAdmin({ children }: { children: React.ReactElement }) {
  const role = useAuthStore((s) => s.user?.role);
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export function App() {
  const ready = useAuthBootstrap();
  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-inkdim text-sm">Loading…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/day-picnic" element={<DayPicnicPage />} />
          <Route path="/overnight" element={<OvernightPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
