import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { cores } from '../constants/cores';

type Props = {
  mensagem?: string;
};

export default function Loading({ mensagem }: Props) {
  return (
    <View style={estilos.container}>
      <ActivityIndicator size="large" color={cores.primaria} />
      {!!mensagem && <Text style={estilos.mensagem}>{mensagem}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    padding: 24,
  },
  mensagem: { marginTop: 12, fontSize: 15, color: cores.texto },
});