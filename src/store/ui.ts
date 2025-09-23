import { create } from "zustand";

type UIState = {
  message: string | null;
  error: string | null;
  setMessage: (m: string | null) => void;
  setError: (e: string | null) => void;
};

export const useUI = create<UIState>((set) => ({
  message: null,
  error: null,
  setMessage: (m) => set({ message: m }),
  setError: (e) => set({ error: e }),
}));
