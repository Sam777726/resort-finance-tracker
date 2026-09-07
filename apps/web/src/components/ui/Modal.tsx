import type { ReactNode } from 'react';

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-2xl max-w-[440px] w-full max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center px-4.5 py-4 border-b border-border">
          <h3 className="text-base font-semibold m-0">{title}</h3>
          <button onClick={onClose} className="text-inkdim text-lg leading-none">&times;</button>
        </div>
        <div className="px-4.5 py-4">{children}</div>
        {footer && <div className="px-4.5 py-3.5 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
