import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
}

let hideTimer: ReturnType<typeof setTimeout>;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(hideTimer);
    set({ message });
    hideTimer = setTimeout(() => set({ message: null }), 2200);
  },
}));

export const toast = (message: string) => useToastStore.getState().show(message);
