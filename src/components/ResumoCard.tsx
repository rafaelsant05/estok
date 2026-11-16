import { View, Text, StyleSheet } from 'react-native';
import { cores } from '../constants/cores';

type Props = {
  titulo: string;
  valor: number;
  cor?: string; // cor do número (padrão: primária)
};

export default function ResumoCard({ titulo, valor, cor = cores.primaria }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.valor, { color: cor }]}>{valor}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // os 3 cards dividem a largura igualmente
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  valor: { fontSize: 26, fontWeight: 'bold' },
  titulo: { fontSize: 12, color: cores.texto, textAlign: 'center', marginTop: 4 },
});