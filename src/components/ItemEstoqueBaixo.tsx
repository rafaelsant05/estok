import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { cores } from '../constants/cores';
import { Produto } from '../types';

type Props = {
  produto: Produto;
  onPress?: () => void;
};

export default function ItemEstoqueBaixo({ produto, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.nome}>{produto.nome}</Text>
        <Text style={styles.categoria}>{produto.categoria}</Text>
      </View>
      <View style={styles.qtdBox}>
        <Text style={styles.qtd}>{produto.quantidade}</Text>
        <Text style={styles.minimo}>mín. {produto.estoqueMinimo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: cores.borda,
    borderLeftWidth: 5,
    borderLeftColor: cores.aviso, // faixa de destaque à esquerda
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  info: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '600', color: cores.texto },
  categoria: { fontSize: 12, color: cores.texto, opacity: 0.6 },
  qtdBox: { alignItems: 'flex-end' },
  qtd: { fontSize: 20, fontWeight: 'bold', color: cores.erro },
  minimo: { fontSize: 12, color: cores.texto, opacity: 0.6 },
});
