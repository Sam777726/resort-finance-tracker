import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePublicStaffRoster, useSetupAdmin, useLogin } from '../hooks/useAuth';
import { apiErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function LoginPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: staff, isLoading } = usePublicStaffRoster();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const setupAdmin = useSetupAdmin();
  const login = useLogin();

  if (accessToken) return <Navigate to="/" replace />;
  if (isLoading) return null;

  const submitPinDigit = async (digit: string) => {
    if (!selected) return;
    if (digit === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (digit === '' || pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    if (next.length >= 4) {
      try {
        await login.mutateAsync({ staffId: selected.id, pin: next });
      } catch (err) {
        if (next.length === 6) {
          setError(apiErrorMessage(err, 'Incorrect PIN'));
          setPin('');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-ground to-surface2">
      <div className="w-full max-w-[380px] bg-surface border border-border rounded-2xl shadow-xl p-7 text-center">
        <div className="font-display text-2xl font-bold text-accentstrong">🏕️ Camp Dilly Ledger</div>

        {staff && staff.length === 0 ? (
          <SetupForm
            onSubmit={(name, pinVal) => setupAdmin.mutate({ name, pin: pinVal })}
            error={setupAdmin.error ? apiErrorMessage(setupAdmin.error) : ''}
          />
        ) : !selected ? (
          <>
            <div className="text-inkdim text-sm mt-0.5 mb-5">Select your name to continue</div>
            <div className="flex flex-col gap-2">
              {staff?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setPin(''); setError(''); }}
                  className="flex justify-between items-center p-3 rounded-lg border border-border bg-surface2 font-semibold text-[15px] hover:border-accent"
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-inkdim">{s.role}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold mt-3 mb-2.5">Enter PIN for {selected.name}</div>
            <div className="flex gap-2.5 justify-center my-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${i < pin.length ? 'bg-accent border-accent' : 'border-border'}`} />
              ))}
            </div>
            <div className="text-danger text-sm h-[18px] mb-1.5">{error}</div>
            <div className="grid grid-cols-3 gap-2.5">
              {PAD_KEYS.map((k, i) => (
                <button
                  key={i}
                  disabled={k === ''}
                  onClick={() => submitPinDigit(k)}
                  className="py-4 text-lg font-semibold rounded-lg border border-border bg-surface2 disabled:invisible active:bg-accentsoft"
                >
                  {k}
                </button>
              ))}
            </div>
            <button className="mt-3.5 text-sm text-inkdim underline" onClick={() => setSelected(null)}>
              &larr; choose a different name
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SetupForm({ onSubmit, error }: { onSubmit: (name: string, pin: string) => void; error: string }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!name.trim()) return setLocalError('Enter your name');
    if (!/^\d{4,6}$/.test(pin)) return setLocalError('PIN must be 4-6 digits');
    if (pin !== pin2) return setLocalError('PINs do not match');
    setLocalError('');
    onSubmit(name.trim(), pin);
  };

  return (
    <>
      <div className="text-inkdim text-sm mt-0.5 mb-5">First-time setup — create the admin PIN</div>
      <div className="flex flex-col gap-2.5 text-left">
        <label className="text-xs font-semibold uppercase text-inkdim">Your Name</label>
        <Input placeholder="e.g. Dhaval" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-xs font-semibold uppercase text-inkdim">Set PIN (4-6 digits)</label>
        <Input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
        <label className="text-xs font-semibold uppercase text-inkdim">Confirm PIN</label>
        <Input inputMode="numeric" maxLength={6} value={pin2} onChange={(e) => setPin2(e.target.value)} />
        <div className="text-danger text-sm min-h-[18px]">{localError || error}</div>
        <Button onClick={submit}>Create Admin & Enter</Button>
      </div>
    </>
  );
}
