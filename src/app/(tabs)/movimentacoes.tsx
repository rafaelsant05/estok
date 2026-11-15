import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const sugestoes = buscaProduto.trim()
    ? produtos
        .filter((produto) => produto.nome.toLocaleLowerCase('pt-BR').includes(buscaProduto.trim().toLocaleLowerCase('pt-BR')))
        .slice(0, 6)
    : [];

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
  const visiveis = movimentacoes.filter((movimentacao) => {
    const produto = produtoPorId.get(movimentacao.produtoId);
    const correspondeTipo = filtro === 'todas' || movimentacao.tipo === filtro;
    const correspondeProduto = !produtoSelecionadoId || movimentacao.produtoId === produtoSelecionadoId;
    const correspondeCategoria = !categoriaSelecionada || produto?.categoria === categoriaSelecionada;
    return correspondeTipo && correspondeProduto && correspondeCategoria;
  });

  const mensagemVazia =
    movimentacoes.length === 0
      ? 'Nenhuma movimentação registrada ainda'
      : 'Nenhuma movimentação desse tipo';

  return (
    <View style={estilos.tela}>
      <View style={estilos.painelFiltros}>
        <Text style={estilos.rotuloFiltro}>Pesquisar produto</Text>
        <View style={estilos.buscaContainer}>
          <Ionicons name="search-outline" size={20} color={cores.texto} />
          <TextInput
            value={produtoSelecionado ? produtoSelecionado.nome : buscaProduto}
            onChangeText={(texto) => {
              setBuscaProduto(texto);
              setProdutoSelecionadoId('');
            }}
            placeholder="Digite o nome do produto"
            placeholderTextColor={`${cores.texto}80`}
            style={estilos.buscaInput}
            accessibilityLabel="Pesquisar produto nas movimentações"
          />
          {!!(buscaProduto || produtoSelecionadoId) && (
            <Pressable onPress={() => { setBuscaProduto(''); setProdutoSelecionadoId(''); }} accessibilityLabel="Limpar busca de produto">
              <Ionicons name="close-circle" size={20} color={cores.texto} />
            </Pressable>
          )}
        </View>
        {sugestoes.length > 0 && !produtoSelecionadoId && (
          <View style={estilos.sugestoes}>
            {sugestoes.map((produto) => (
              <Pressable key={produto.id} onPress={() => { setProdutoSelecionadoId(produto.id); setBuscaProduto(''); }} style={estilos.sugestao}>
                <Text style={estilos.sugestaoNome}>{produto.nome}</Text>
                <Text style={estilos.sugestaoCategoria}>{produto.categoria}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={estilos.rotuloFiltro}>Categoria</Text>
        <Pressable onPress={() => setDropdownCategoriaAberto((aberto) => !aberto)} style={estilos.seletorCategoria} accessibilityRole="button">
          <Text style={estilos.seletorCategoriaTexto}>{categoriaSelecionada || 'Todas as categorias'}</Text>
          <Ionicons name={dropdownCategoriaAberto ? 'chevron-up' : 'chevron-down'} size={18} color={cores.texto} />
        </Pressable>
        {dropdownCategoriaAberto && (
          <View style={estilos.opcoesCategoria}>
            {['', ...categorias].map((categoria) => {
              const ativo = categoriaSelecionada === categoria;
              return (
                <Pressable key={categoria || 'todas'} onPress={() => { setCategoriaSelecionada(categoria); setDropdownCategoriaAberto(false); }} style={estilos.opcaoCategoria}>
                  <Text style={[estilos.opcaoCategoriaTexto, ativo && estilos.opcaoCategoriaAtiva]}>{categoria || 'Todas as categorias'}</Text>
                  {ativo && <Ionicons name="checkmark" size={18} color={cores.primaria} />}
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
  painelFiltros: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: cores.borda },
  rotuloFiltro: { fontSize: 13, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  buscaContainer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  buscaInput: { flex: 1, color: cores.texto, paddingVertical: 8 },
  sugestoes: { marginTop: 4, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  sugestao: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.borda },
  sugestaoNome: { color: cores.texto, fontSize: 14, fontWeight: '600' },
  sugestaoCategoria: { color: cores.texto, opacity: 0.65, fontSize: 12, marginTop: 2 },
  seletorCategoria: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 4 },
  seletorCategoriaTexto: { color: cores.texto, fontSize: 14 },
  opcoesCategoria: { borderWidth: 1, borderColor: cores.borda, borderRadius: 10, overflow: 'hidden', marginBottom: 8, backgroundColor: '#FFFFFF' },
  opcaoCategoria: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: cores.borda },
  opcaoCategoriaTexto: { color: cores.texto, fontSize: 14 },
  opcaoCategoriaAtiva: { fontWeight: '700', color: cores.primaria },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
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
