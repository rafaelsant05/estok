import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import { Produto } from '../types';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  produto: Produto;
  onPress?: () => void;
  onRepor?: () => void;
};

export default function ItemEstoqueBaixo({ produto, onPress, onRepor }: Props) {
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const esgotado = produto.quantidade === 0;
  const abaixoDoMinimo = produto.quantidade < produto.estoqueMinimo;
  const corStatus = esgotado ? cores.erro : cores.aviso;
  const rotuloStatus = esgotado
    ? 'Esgotado'
    : abaixoDoMinimo
      ? 'Abaixo do mínimo'
      : 'No mínimo';

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: cores.card,
          borderColor: cores.borda,
          borderLeftColor: corStatus,
          shadowColor: cores.texto,
        },
      ]}
    >
      <Pressable
        style={styles.info}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${produto.nome}, estoque ${produto.quantidade}, mínimo ${produto.estoqueMinimo}`}
      >
        <Text style={[styles.nome, { color: cores.texto }]} numberOfLines={1}>
          {produto.nome}
        </Text>
        <Text style={[styles.categoria, { color: cores.textoSecundario }]} numberOfLines={1}>
          {produto.categoria}
        </Text>
        <Text style={[styles.status, { color: corStatus }]}>{rotuloStatus}</Text>
      </Pressable>
      <View style={styles.acoes}>
        <Pressable
          style={styles.qtdBox}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${produto.nome}, estoque ${produto.quantidade}, mínimo ${produto.estoqueMinimo}`}
        >
          <Text style={[styles.saldo, { color: corStatus }]}>
            {produto.quantidade} / mín. {produto.estoqueMinimo}
          </Text>
          <Text style={[styles.minimo, { color: cores.textoSecundario }]}>saldo atual</Text>
        </Pressable>
        {onRepor && (
          <Pressable
            style={[styles.repor, { borderColor: cores.borda, backgroundColor: cores.superficie }]}
            onPress={onRepor}
            accessibilityRole="button"
            accessibilityLabel={`Registrar entrada para ${produto.nome}`}
          >
            <Ionicons name="add" size={16} color={cores.primaria} />
            <Text style={[styles.textoRepor, { color: cores.primaria }]}>Repor</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  info: { flex: 1, paddingRight: 8 },
  nome: { fontSize: 16, fontWeight: '700' },
  categoria: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  status: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  acoes: { alignItems: 'flex-end', gap: 8 },
  qtdBox: { alignItems: 'flex-end' },
  saldo: { fontSize: 13, fontWeight: '800' },
  minimo: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  repor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoRepor: { fontSize: 12, fontWeight: '700' },
});
