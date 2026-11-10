import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../constants/cores';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: 'primario' | 'secundario' | 'perigo';
};

export default function Botao({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
}: Props) {
  const inativo = carregando || desabilitado;
  const corTexto = variante === 'secundario' ? cores.primaria : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'primario' && estilos.primario,
        variante === 'perigo' && estilos.perigo,
        variante === 'secundario' && estilos.secundario,
        inativo && estilos.inativo,
        pressed && !inativo && estilos.pressionado,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.texto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primario: { backgroundColor: cores.primaria },
  perigo: { backgroundColor: cores.erro },
  secundario: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: cores.primaria,
  },
  inativo: { opacity: 0.6 },
  pressionado: { opacity: 0.85 },
  texto: { fontSize: 16, fontWeight: '600' },
});