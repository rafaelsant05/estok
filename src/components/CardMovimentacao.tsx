import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../constants/cores';
import { Movimentacao } from '../types';

// Nomes bonitos para mostrar os motivos na tela
const ROTULOS_MOTIVO: Record<string, string> = {
  compra: 'Compra',
  devolucao: 'Devolução',
  ajuste: 'Ajuste',
  venda: 'Venda',
  perda: 'Perda',
  uso_proprio: 'Uso próprio',
};

export function rotuloMotivo(motivo: string): string {
  return ROTULOS_MOTIVO[motivo] ?? motivo;
}

// Transforma o timestamp em "dd/mm/aaaa hh:mm"
export function formatarData(timestamp: number): string {
  const d = new Date(timestamp);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(
    d.getHours()
  )}:${dois(d.getMinutes())}`;
}

type Props = { movimentacao: Movimentacao };

// Um item do histórico
export default function CardMovimentacao({ movimentacao }: Props) {
  const entrada = movimentacao.tipo === 'entrada';
  const cor = entrada ? cores.sucesso : cores.erro;

  return (
    <View style={styles.card}>
      <Ionicons
        name={entrada ? 'arrow-down-circle' : 'arrow-up-circle'}
        size={36}
        color={cor}
      />
      <View style={styles.centro}>
        <Text style={styles.nome}>{movimentacao.produtoNome}</Text>
        <Text style={styles.detalhe}>
          {entrada ? 'Entrada' : 'Saída'} • {rotuloMotivo(movimentacao.motivo)}
        </Text>
        <Text style={styles.detalhe}>{formatarData(movimentacao.data)}</Text>
      </View>
      <Text style={[styles.quantidade, { color: cor }]}>
        {entrada ? '+' : '-'}
        {movimentacao.quantidade}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  centro: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: 13, color: cores.texto, opacity: 0.7, marginTop: 2 },
  quantidade: { fontSize: 20, fontWeight: 'bold' },
});