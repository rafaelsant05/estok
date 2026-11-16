export type TemaResolvido = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  disabled: string;
  selection: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
  info: string;
};

export const THEME_COLORS: Record<TemaResolvido, Colors> = {
  light: {
    background: '#F3F5F8',
    surface: '#FFFFFF',
    primary: '#183153',
    secondary: '#29496B',
    textPrimary: '#171C24',
    textSecondary: '#697586',
    border: '#E1E6ED',
    disabled: '#A7B0BC',
    selection: '#E8EEF5',
    icon: '#34465D',
    success: '#16845F',
    warning: '#D99522',
    error: '#D94848',
    info: '#3478B9',
  },
  dark: {
    background: '#111820',
    surface: '#1C2632',
    primary: '#29496B',
    secondary: '#365D85',
    textPrimary: '#F0F3F7',
    textSecondary: '#A4AFBD',
    border: '#303D4C',
    disabled: '#667384',
    selection: '#26384C',
    icon: '#B5C4D6',
    success: '#35B887',
    warning: '#E9AD43',
    error: '#F06B70',
    info: '#65A9E8',
  },
};

export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
