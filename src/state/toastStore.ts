/*
Tiny global toast: one message at a time, shown by <ToastHost /> at the app
root. Call showToast() from anywhere (components or plain utilities).
*/
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toast: ToastMessage | null;
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  // A new toast replaces the current one immediately.
  show: (message, type = 'info') => set({ toast: { id: nextId++, message, type } }),
  // Only dismiss the toast the timer was started for, so an older timer
  // can't hide a newer message.
  dismiss: (id) => set((state) => (state.toast?.id === id ? { toast: null } : state)),
}));

export const showToast = (message: string, type: ToastType = 'info') =>
  useToastStore.getState().show(message, type);
