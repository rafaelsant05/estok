import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export type PerfilUsuario = {
  displayName: string;
  photoUrl: string | null;
  cpf: string;
  role: string;
  storeName: string;
  defaultMinStock: number | null;
};

export function criarPerfilPadrao(user?: User | null): PerfilUsuario {
  return {
    displayName: user?.displayName ?? '',
    photoUrl: user?.photoURL ?? null,
    cpf: '',
    role: '',
    storeName: '',
    defaultMinStock: null,
  };
}

type LogoutOptions = {
  firebaseJaDesconectado?: boolean;
};

type AuthState = {
  user: User | null;
  perfil: PerfilUsuario;
  perfilUid: string | null;
  carregandoPerfil: boolean;
  erroPerfil: string | null;
  carregando: boolean;
  setUser: (user: User | null) => void;
  setPerfil: (uid: string, perfil: PerfilUsuario) => void;
  setErroPerfil: (erro: string | null) => void;
  setCarregando: (carregando: boolean) => void;
  logout: (options?: LogoutOptions) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  perfil: criarPerfilPadrao(),
  perfilUid: null,
  carregandoPerfil: false,
  erroPerfil: null,
  carregando: true,
  setUser: (user) =>
    set((estado) => {
      if (!user) {
        return {
          user: null,
          perfil: criarPerfilPadrao(),
          perfilUid: null,
          carregandoPerfil: false,
          erroPerfil: null,
          carregando: false,
        };
      }

      if (estado.perfilUid === user.uid) {
        return { user, carregando: false };
      }

      return {
        user,
        perfil: criarPerfilPadrao(user),
        perfilUid: user.uid,
        carregandoPerfil: true,
        erroPerfil: null,
        carregando: false,
      };
    }),
  setPerfil: (uid, perfil) =>
    set((estado) =>
      estado.user?.uid === uid
        ? { perfil, perfilUid: uid, carregandoPerfil: false }
        : estado,
    ),
  setErroPerfil: (erroPerfil) => set({ erroPerfil }),
  setCarregando: (carregando) => set({ carregando }),
  logout: async ({ firebaseJaDesconectado = false } = {}) => {
    set({ carregando: true });

    try {
      if (!firebaseJaDesconectado) {
        await signOut(auth);
      }
      set({
        user: null,
        perfil: criarPerfilPadrao(),
        perfilUid: null,
        carregandoPerfil: false,
        erroPerfil: null,
        carregando: false,
      });
    } catch (erro) {
      set({ carregando: false });
      throw erro;
    }
  },
}));