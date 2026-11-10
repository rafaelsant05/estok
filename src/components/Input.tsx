import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores } from '../constants/cores';

type Props = TextInputProps & {
  label: string;
  erro?: string;
};

export default function Input({ label, erro, style, ...resto }: Props) {
  return (
    <View style={estilos.container}>
      <Text style={estilos.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        style={[estilos.input, !!erro && estilos.inputErro, style]}
        {...resto}
      />
      {!!erro && <Text style={estilos.erro}>{erro}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: '#FFFFFF',
  },
  inputErro: { borderColor: cores.erro },
  erro: { color: cores.erro, fontSize: 13, marginTop: 4 },
});