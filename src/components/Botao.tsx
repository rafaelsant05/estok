import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type Props = {
  titulo: string;
  onPress: () => void;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: 'primario' | 'secundario' | 'perigo';
};

export default function Botao({
  titulo,
  onPress,
  icone,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
}: Props) {
  const inativo = carregando || desabilitado;
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const corTexto = variante === 'secundario' ? cores.primaria : cores.textoSobreAcao;
  const estiloVariante =
    variante === 'primario'
      ? { backgroundColor: cores.primaria }
      : variante === 'perigo'
        ? { backgroundColor: cores.erro }
        : { backgroundColor: 'transparent', borderColor: cores.primaria };

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.botao,
        estiloVariante,
        variante === 'secundario' && estilos.secundario,
        inativo && estilos.inativo,
        pressed && !inativo && estilos.pressionado,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : icone ? (
        <View style={estilos.conteudoComIcone}>
          <Ionicons name={icone} size={20} color={corTexto} />
          <Text style={[estilos.texto, { color: corTexto }]}>{titulo}</Text>
        </View>
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
  secundario: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  inativo: { opacity: 0.6 },
  pressionado: { opacity: 0.85 },
  texto: { fontSize: 16, fontWeight: '600' },
  conteudoComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});