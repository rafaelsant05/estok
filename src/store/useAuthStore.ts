import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { chavePerfilStorage } from '../constants/storageKeys';

export type PerfilUsuario = {
  displayName: string;
  photoUrl: string | null;
  storeName: string;
  defaultMinStock: number | null;
  onboardingConcluido?: boolean;
};

export function criarPerfilPadrao(user?: User | null): PerfilUsuario {
  return {
    displayName: user?.displayName ?? '',
    photoUrl: user?.photoURL ?? null,
    storeName: '',
    defaultMinStock: null,
  };
}

type LogoutOptions = {
  firebaseJaDesconectado?: boolean;
  uid?: string;
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

export const useAuthStore = create<AuthState>((set, get) => ({
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
    set((estado) => {
      if (estado.user?.uid !== uid) return estado;
      const onboardingConcluido =
        perfil.onboardingConcluido === undefined &&
        typeof estado.perfil.onboardingConcluido === 'boolean'
          ? estado.perfil.onboardingConcluido
          : perfil.onboardingConcluido;
      return {
        perfil: { ...perfil, onboardingConcluido },
        perfilUid: uid,
        carregandoPerfil: false,
      };
    }),
  setErroPerfil: (erroPerfil) => set({ erroPerfil }),
  setCarregando: (carregando) => set({ carregando }),
  logout: async ({ firebaseJaDesconectado = false, uid: uidInformado } = {}) => {
    const uid = uidInformado ?? get().user?.uid;
    set({ carregando: true });

    try {
      if (!firebaseJaDesconectado) {
        await signOut(auth);
      }
    } catch (erro) {
      set({ carregando: false });
      throw erro;
    }

    let erroCache: unknown;
    if (uid) {
      try {
        await AsyncStorage.removeItem(chavePerfilStorage(uid));
      } catch (erro) {
        erroCache = erro;
      }
    }

    set({
      user: null,
      perfil: criarPerfilPadrao(),
      perfilUid: null,
      carregandoPerfil: false,
      erroPerfil: null,
      carregando: false,
    });

    if (erroCache) {
      throw new Error('A sessão foi encerrada, mas não foi possível remover o perfil salvo neste dispositivo.');
    }
  },
}));