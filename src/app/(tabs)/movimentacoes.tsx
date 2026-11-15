import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CardMovimentacao from '../../components/CardMovimentacao';
import FormMovimentacao from '../../components/FormMovimentacao';
import Feedback from '../../components/Feedback';
import Loading from '../../components/Loading';
import { cores } from '../../constants/cores';
import { listarMovimentacoes } from '../../services/movimentacoesService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { Movimentacao } from '../../types';

type Filtro = 'todas' | 'entrada' | 'saida';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'entrada', rotulo: 'Entradas' },
  { valor: 'saida', rotulo: 'Saídas' },
];

export default function Movimentacoes() {
  const user = useAuthStore((s) => s.user);
  const carregarProdutos = useProdutosStore((s) => s.carregar);

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);

  // Busca o histórico no Firestore
  const carregarHistorico = useCallback(async () => {
    if (!user) return;
    try {
      setErro(null);
      const lista = await listarMovimentacoes(user.uid);
      setMovimentacoes(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.');
    }
  }, [user]);

  // Recarrega o histórico e os produtos sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setCarregando(true);
      Promise.all([carregarHistorico(), carregarProdutos(user.uid)]).finally(() =>
        setCarregando(false)
      );
    }, [user, carregarHistorico, carregarProdutos])
  );

  // Puxar a lista para baixo para atualizar
  async function atualizar() {
    setAtualizando(true);
    await carregarHistorico();
    setAtualizando(false);
  }

  // Aplica o filtro por tipo
  const visiveis =
    filtro === 'todas' ? movimentacoes : movimentacoes.filter((m) => m.tipo === filtro);

  const mensagemVazia =
    movimentacoes.length === 0
      ? 'Nenhuma movimentação registrada ainda'
      : 'Nenhuma movimentação desse tipo';

  return (
    <View style={estilos.tela}>
      {/* Filtro por tipo */}
      <View style={estilos.filtros}>
        {FILTROS.map((f) => {
          const ativo = filtro === f.valor;
          return (
            <Pressable
              key={f.valor}
              onPress={() => setFiltro(f.valor)}
              style={[estilos.chip, ativo && estilos.chipAtivo]}
            >
              <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>
                {f.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!erro && (
        <View style={estilos.feedback}>
          <Feedback tipo="erro" mensagem={erro} onFechar={() => setErro(null)} />
        </View>
      )}

      {carregando ? (
        <Loading mensagem="Carregando movimentações..." />
      ) : (
        <FlatList
          data={visiveis}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CardMovimentacao movimentacao={item} />}
          contentContainerStyle={estilos.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} />}
          ListEmptyComponent={
            <View style={estilos.vazio}>
              <Ionicons name="swap-vertical-outline" size={48} color={cores.borda} />
              <Text style={estilos.vazioTexto}>{mensagemVazia}</Text>
            </View>
          }
        />
      )}

      {/* Botão flutuante: abre o formulário */}
      <Pressable style={estilos.botaoNovo} onPress={() => setFormAberto(true)}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={estilos.botaoNovoTexto}>Nova movimentação</Text>
      </Pressable>

      <FormMovimentacao
        visible={formAberto}
        onFechar={() => setFormAberto(false)}
        onSalvo={() => {
          setFormAberto(false);
          carregarHistorico();
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  filtros: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: '#FFFFFF',
  },
  chipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipTexto: { fontSize: 14, fontWeight: '600', color: cores.texto },
  chipTextoAtivo: { color: '#FFFFFF' },
  feedback: { paddingHorizontal: 16 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 96, flexGrow: 1 },
  vazio: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 12 },
  vazioTexto: { fontSize: 15, color: cores.texto, opacity: 0.7, textAlign: 'center' },
  botaoNovo: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: cores.primaria,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 4,
  },
  botaoNovoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
