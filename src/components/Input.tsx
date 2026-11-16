import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type Props = TextInputProps & {
  label: string;
  erro?: string;
  rightAction?: ReactNode;
};

export default function Input({ label, erro, style, rightAction, ...resto }: Props) {
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const campo = (
    <TextInput
      placeholderTextColor={cores.desabilitado}
      style={[
        estilos.input,
        { color: cores.texto, borderColor: cores.borda, backgroundColor: cores.card },
        !!erro && { borderColor: cores.erro },
        rightAction ? estilos.inputComAcao : undefined,
        style,
      ]}
      {...resto}
    />
  );

  return (
    <View style={estilos.container}>
      <Text style={[estilos.label, { color: cores.texto }]}>{label}</Text>
      {rightAction ? (
        <View style={estilos.linhaInput}>
          {campo}
          {rightAction}
        </View>
      ) : (
        campo
      )}
      {!!erro && <Text style={[estilos.erro, { color: cores.erro }]}>{erro}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  linhaInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputComAcao: { flex: 1 },
  erro: { fontSize: 13, marginTop: 4 },
});