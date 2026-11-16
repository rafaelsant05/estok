import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CardMovimentacao from '../../components/CardMovimentacao';
import FormMovimentacao from '../../components/FormMovimentacao';
import Feedback from '../../components/Feedback';
import Loading from '../../components/Loading';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import { listarMovimentacoes } from '../../services/movimentacoesService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { Movimentacao } from '../../types';
import { useMovimentacoesFiltradas } from '../../hooks/useMovimentacoesFiltradas';
import { sugerirProdutosPorNome } from '../../utils/negocio';

type Filtro = 'todas' | 'entrada' | 'saida';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'entrada', rotulo: 'Entradas' },
  { valor: 'saida', rotulo: 'Saídas' },
];

export default function Movimentacoes() {
  const tema = useThemeStore((s) => s.tema);
  const paleta = PALETAS_TEMA[tema];
  const user = useAuthStore((s) => s.user);
  const carregarProdutos = useProdutosStore((s) => s.carregar);
  const produtos = useProdutosStore((s) => s.produtos);

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [dropdownCategoriaAberto, setDropdownCategoriaAberto] = useState(false);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((produto) => produto.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [produtos]
  );
  const produtoPorId = useMemo(() => new Map(produtos.map((produto) => [produto.id, produto])), [produtos]);
  const produtoSelecionado = produtos.find((produto) => produto.id === produtoSelecionadoId);
  const sugestoes = useMemo(
    () => sugerirProdutosPorNome(produtos, buscaProduto, categoriaSelecionada),
    [produtos, buscaProduto, categoriaSelecionada],
  );

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

  const visiveis = useMovimentacoesFiltradas(
    movimentacoes,
    filtro,
    produtoSelecionadoId,
    categoriaSelecionada,
    produtoPorId,
  );

  const mensagemVazia =
    movimentacoes.length === 0
      ? 'Nenhuma movimentação registrada ainda'
      : 'Nenhuma movimentação desse tipo';

  return (
    <View style={[estilos.tela, { backgroundColor: paleta.fundo }]}>
      <View style={[estilos.painelFiltros, { backgroundColor: paleta.card, borderBottomColor: paleta.borda }]}>
        <Text style={[estilos.rotuloFiltro, { color: paleta.texto }]}>Pesquisar produto</Text>
        <View style={[estilos.buscaContainer, { backgroundColor: paleta.superficie, borderColor: paleta.borda }]}>
          <Ionicons name="search-outline" size={20} color={paleta.primaria} />
          <TextInput
            value={produtoSelecionado ? produtoSelecionado.nome : buscaProduto}
            onChangeText={(texto) => {
              setBuscaProduto(texto);
              setProdutoSelecionadoId('');
            }}
            placeholder="Digite o nome do produto"
            placeholderTextColor={paleta.desabilitado}
            style={[estilos.buscaInput, { color: paleta.texto }]}
            accessibilityLabel="Pesquisar produto nas movimentações"
          />
          {!!(buscaProduto || produtoSelecionadoId) && (
            <Pressable onPress={() => { setBuscaProduto(''); setProdutoSelecionadoId(''); }} accessibilityLabel="Limpar busca de produto">
              <Ionicons name="close-circle" size={20} color={paleta.textoSecundario} />
            </Pressable>
          )}
        </View>
        {sugestoes.length > 0 && !produtoSelecionadoId && (
          <View style={[estilos.sugestoes, { backgroundColor: paleta.card, borderColor: paleta.borda }]}>
            {sugestoes.map((produto) => (
              <Pressable key={produto.id} onPress={() => { setProdutoSelecionadoId(produto.id); setBuscaProduto(''); }} style={[estilos.sugestao, { borderBottomColor: paleta.borda }]}>
                <Text style={[estilos.sugestaoNome, { color: paleta.texto }]}>{produto.nome}</Text>
                <Text style={[estilos.sugestaoCategoria, { color: paleta.textoSecundario }]}>{produto.categoria}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[estilos.rotuloFiltro, { color: paleta.texto }]}>Categoria</Text>
        <Pressable onPress={() => setDropdownCategoriaAberto((aberto) => !aberto)} style={[estilos.seletorCategoria, { backgroundColor: paleta.superficie, borderColor: paleta.borda }]} accessibilityRole="button">
          <Text style={[estilos.seletorCategoriaTexto, { color: paleta.texto }]}>{categoriaSelecionada || 'Todas as categorias'}</Text>
          <Ionicons name={dropdownCategoriaAberto ? 'chevron-up' : 'chevron-down'} size={18} color={paleta.texto} />
        </Pressable>
        {dropdownCategoriaAberto && (
          <View style={[estilos.opcoesCategoria, { backgroundColor: paleta.card, borderColor: paleta.borda }]}>
            {['', ...categorias].map((categoria) => {
              const ativo = categoriaSelecionada === categoria;
              return (
                <Pressable key={categoria || 'todas'} onPress={() => { setCategoriaSelecionada(categoria); setDropdownCategoriaAberto(false); }} style={[estilos.opcaoCategoria, { borderBottomColor: paleta.borda }]}>
                  <Text style={[estilos.opcaoCategoriaTexto, { color: ativo ? paleta.primaria : paleta.texto, fontWeight: ativo ? '700' : '400' }]}>{categoria || 'Todas as categorias'}</Text>
                  {ativo && <Ionicons name="checkmark" size={18} color={paleta.primaria} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Filtro por tipo */}
      <View style={estilos.filtros}>
        {FILTROS.map((f) => {
          const ativo = filtro === f.valor;
          return (
            <Pressable
              key={f.valor}
              onPress={() => setFiltro(f.valor)}
              style={[
                estilos.chip,
                { backgroundColor: ativo ? paleta.primaria : paleta.card, borderColor: ativo ? paleta.primaria : paleta.borda },
              ]}
            >
              <Text style={[estilos.chipTexto, { color: ativo ? paleta.textoSobreAcao : paleta.texto }]}>
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
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <CardMovimentacao movimentacao={item} />}
          contentContainerStyle={estilos.lista}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} />}
          ListEmptyComponent={
            <View style={estilos.vazio}>
              <Ionicons name="swap-vertical-outline" size={48} color={paleta.borda} />
              <Text style={[estilos.vazioTexto, { color: paleta.textoSecundario }]}>{mensagemVazia}</Text>
            </View>
          }
        />
      )}

      {/* Botão flutuante: abre o formulário */}
      <Pressable
        style={[estilos.botaoNovo, { backgroundColor: paleta.primaria, shadowColor: paleta.texto }]}
        onPress={() => setFormAberto(true)}
      >
        <Ionicons name="add" size={22} color={paleta.textoSobreAcao} />
        <Text style={[estilos.botaoNovoTexto, { color: paleta.textoSobreAcao }]}>Nova movimentação</Text>
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
  tela: { flex: 1 },
  painelFiltros: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1 },
  rotuloFiltro: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  buscaContainer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  buscaInput: { flex: 1, paddingVertical: 8, fontSize: 15 },
  sugestoes: { marginTop: 6, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  sugestao: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  sugestaoNome: { fontSize: 14, fontWeight: '600' },
  sugestaoCategoria: { opacity: 0.8, fontSize: 12, marginTop: 2 },
  seletorCategoria: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 4 },
  seletorCategoriaTexto: { fontSize: 14, fontWeight: '600' },
  opcoesCategoria: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  opcaoCategoria: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  opcaoCategoriaTexto: { fontSize: 14 },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipTexto: { fontSize: 14, fontWeight: '600' },
  feedback: { paddingHorizontal: 16 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 96, flexGrow: 1 },
  vazio: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 12 },
  vazioTexto: { fontSize: 15, opacity: 0.7, textAlign: 'center' },
  botaoNovo: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  botaoNovoTexto: { fontSize: 15, fontWeight: '700' },
});
