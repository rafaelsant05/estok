import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type Props = {
  titulo: string;
  valor: number;
  icone: NomeIcone;
  cor?: string; // cor do número (padrão: primária)
  onPress?: () => void;
};

export default function ResumoCard({
  titulo,
  valor,
  icone,
  cor,
  onPress,
}: Props) {
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const corResumo = cor ?? cores.primaria;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cores.card, borderColor: cores.borda, shadowColor: cores.texto },
        pressed && styles.pressionado,
      ]}
    >
      <View style={styles.resumo}>
        <View
          style={[
            styles.iconeContainer,
            { backgroundColor: cores.superficie },
          ]}
        >
          <Ionicons name={icone} size={16} color={corResumo} />
        </View>
        <Text style={[styles.valor, { color: corResumo }]}>{valor}</Text>
      </View>
      <Text style={[styles.titulo, { color: cores.textoSecundario }]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,

    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconeContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  titulo: { fontSize: 11, textAlign: 'center', marginTop: 6, opacity: 0.9 },
  pressionado: { opacity: 0.84 },
});