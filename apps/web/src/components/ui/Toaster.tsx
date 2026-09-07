import clsx from 'clsx';
import { useToastStore } from '../../store/toastStore';

export function Toaster() {
  const message = useToastStore((s) => s.message);
  return (
    <div
      className={clsx(
        'fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-ground px-4.5 py-2.5 rounded-full text-sm font-semibold z-[80] transition-opacity pointer-events-none',
        message ? 'opacity-100' : 'opacity-0',
      )}
    >
      {message}
    </div>
  );
}
