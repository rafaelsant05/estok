import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

type AuthState = {
  user: User | null;
  carregando: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  carregando: true,
  setUser: (user) => set({ user, carregando: false }),
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));