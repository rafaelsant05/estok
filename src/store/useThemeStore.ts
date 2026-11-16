import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { THEME_COLORS, TemaResolvido } from '../theme/colors';

export type Tema = TemaResolvido | 'system';

export type PaletaTema = {
  primaria: string;
  secundaria: string;
  fundo: string;
  card: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  borda: string;
  desabilitado: string;
  icone: string;
  informacao: string;
  erro: string;
  sucesso: string;
  aviso: string;
  textoSobreAcao: string;
  textoSobreStatus: string;
};

type CoresTemas = Record<TemaResolvido, PaletaTema>;

export const PALETAS_TEMA: CoresTemas = {
  light: {
    primaria: THEME_COLORS.light.primary,
    secundaria: THEME_COLORS.light.secondary,
    fundo: THEME_COLORS.light.background,
    card: THEME_COLORS.light.surface,
    superficie: THEME_COLORS.light.selection,
    texto: THEME_COLORS.light.textPrimary,
    textoSecundario: THEME_COLORS.light.textSecondary,
    borda: THEME_COLORS.light.border,
    desabilitado: THEME_COLORS.light.disabled,
    icone: THEME_COLORS.light.icon,
    informacao: THEME_COLORS.light.info,
    erro: THEME_COLORS.light.error,
    sucesso: THEME_COLORS.light.success,
    aviso: THEME_COLORS.light.warning,
    textoSobreAcao: THEME_COLORS.light.surface,
    textoSobreStatus: THEME_COLORS.light.textPrimary,
  },
  dark: {
    primaria: THEME_COLORS.dark.primary,
    secundaria: THEME_COLORS.dark.secondary,
    fundo: THEME_COLORS.dark.background,
    card: THEME_COLORS.dark.surface,
    superficie: THEME_COLORS.dark.selection,
    texto: THEME_COLORS.dark.textPrimary,
    textoSecundario: THEME_COLORS.dark.textSecondary,
    borda: THEME_COLORS.dark.border,
    desabilitado: THEME_COLORS.dark.disabled,
    icone: THEME_COLORS.dark.icon,
    informacao: THEME_COLORS.dark.info,
    erro: THEME_COLORS.dark.error,
    sucesso: THEME_COLORS.dark.success,
    aviso: THEME_COLORS.dark.warning,
    textoSobreAcao: THEME_COLORS.dark.textPrimary,
    textoSobreStatus: THEME_COLORS.dark.background,
  },
};

type ThemeState = {
  tema: TemaResolvido;
  preferencia: Tema;
  temaSistema: TemaResolvido;
  setTema: (tema: Tema) => void;
  setTemaSistema: (tema: TemaResolvido) => void;
  alternarTema: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      tema: 'light',
      preferencia: 'system',
      temaSistema: 'light',
      setTema: (preferencia) =>
        set((estado) => ({
          preferencia,
          tema: preferencia === 'system' ? estado.temaSistema : preferencia,
        })),
      setTemaSistema: (temaSistema) =>
        set((estado) => ({
          temaSistema,
          ...(estado.preferencia === 'system' ? { tema: temaSistema } : {}),
        })),
      alternarTema: () =>
        set((estado) => {
          const tema = estado.tema === 'light' ? 'dark' : 'light';
          return { tema, preferencia: tema };
        }),
    }),
    {
      name: 'estok-tema',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (estado) => ({
        preferencia: estado.preferencia,
        tema: estado.tema,
      }),
      migrate: (estadoPersistido, versao) => {
        const estado =
          estadoPersistido && typeof estadoPersistido === 'object'
            ? (estadoPersistido as { tema?: Tema; preferencia?: Tema })
            : {};
        if (versao < 2 && !estado.preferencia && estado.tema) {
          return { ...estado, preferencia: estado.tema };
        }
        return estado as Partial<ThemeState>;
      },
    },
  ),
);
