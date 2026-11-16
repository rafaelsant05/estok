import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type Props = {
  mensagem?: string;
};

export default function Loading({ mensagem }: Props) {
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  return (
    <View style={[estilos.container, { backgroundColor: cores.fundo }]}>
      <ActivityIndicator size="large" color={cores.primaria} />
      {!!mensagem && <Text style={[estilos.mensagem, { color: cores.texto }]}>{mensagem}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mensagem: { marginTop: 12, fontSize: 15 },
});