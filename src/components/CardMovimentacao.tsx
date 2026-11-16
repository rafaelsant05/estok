import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
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
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const cor = entrada ? cores.sucesso : cores.erro;

  return (
    <View style={[styles.card, { backgroundColor: cores.card, borderColor: cores.borda }]}>
      <Ionicons
        name={entrada ? 'arrow-down-circle' : 'arrow-up-circle'}
        size={36}
        color={cor}
      />
      <View style={styles.centro}>
        <Text style={[styles.nome, { color: cores.texto }]}>{movimentacao.produtoNome}</Text>
        <Text style={[styles.detalhe, { color: cores.textoSecundario }]}>
          {entrada ? 'Entrada' : 'Saída'} • {rotuloMotivo(movimentacao.motivo)}
        </Text>
        {!!movimentacao.varianteNome && <Text style={[styles.detalhe, { color: cores.textoSecundario }]}>Característica: {movimentacao.varianteNome}</Text>}
        <Text style={[styles.detalhe, { color: cores.textoSecundario }]}>{formatarData(movimentacao.data)}</Text>
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  centro: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '600' },
  detalhe: { fontSize: 13, opacity: 0.9, marginTop: 2 },
  quantidade: { fontSize: 20, fontWeight: 'bold' },
});
