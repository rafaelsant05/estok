import { useCallback, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Botao from './Botao';
import Input from './Input';
import Feedback from './Feedback';
import { rotuloMotivo } from './CardMovimentacao';
import { useAuthStore } from '../store/useAuthStore';
import { useProdutosStore } from '../store/useProdutosStore';
import { registrarMovimentacao } from '../services/movimentacoesService';
import { MOTIVOS_ENTRADA, MOTIVOS_SAIDA, TipoMovimentacao } from '../types';
import { useMovimentacaoValidadora } from '../hooks/useMovimentacaoValidadora';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import { withOpacity } from '../theme/colors';

type Props = {
  visible: boolean;
  onFechar: () => void;
  onSalvo: () => void; // avisa a tela para recarregar o histórico
  produtoInicialId?: string;
  tipoInicial?: TipoMovimentacao;
};

export default function FormMovimentacao({
  visible,
  onFechar,
  onSalvo,
  produtoInicialId,
  tipoInicial,
}: Props) {
  const tema = useThemeStore((s) => s.tema);
  const paleta = PALETAS_TEMA[tema];
  const user = useAuthStore((s) => s.user);
  const produtos = useProdutosStore((s) => s.produtos);
  const carregarProdutos = useProdutosStore((s) => s.carregar);
  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Valores dos campos
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [varianteId, setVarianteId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaProduto, setCategoriaProduto] = useState('');
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(new Date());
  const [mostrarData, setMostrarData] = useState(false);

  // Mensagens de erro de cada campo
  const [erroProduto, setErroProduto] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');

  const resetarFormulario = useCallback(() => {
    setSelectedProductId(produtoInicialId ?? null);
    setVarianteId('');
    setSearchQuery('');
    setCategoriaProduto('');
    setTipo(tipoInicial ?? 'entrada');
    setQuantidade('');
    setMotivo('');
    setData(new Date());
    setMostrarData(false);
    setErroProduto('');
    setErroQuantidade('');
    setErroMotivo('');
    setErroGeral('');
  }, [produtoInicialId, tipoInicial]);

  // Os motivos mudam conforme o tipo
  const motivos: readonly string[] =
    tipo === 'entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;
  const categorias = Array.from(new Set(produtos.map((produto) => produto.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const selectedProduct = produtos.find((produto) => produto.id === selectedProductId);

  const validacao = useMovimentacaoValidadora({
    produtoId: selectedProductId,
    produtoSelecionado: selectedProduct,
    varianteId,
    quantidade,
    motivo,
    tipo,
  });

  const sugestoesProduto = searchQuery.trim()
    ? produtos.filter((produto) =>
        produto.nome.toLocaleLowerCase('pt-BR').includes(searchQuery.trim().toLocaleLowerCase('pt-BR')) &&
        (!categoriaProduto || produto.categoria === categoriaProduto)
      ).slice(0, 6)
    : [];

  function limparProdutoSelecionado() {
    setSelectedProductId(null);
    setVarianteId('');
    setSearchQuery('');
    setErroProduto('');
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function trocarTipo(novoTipo: TipoMovimentacao) {
    setTipo(novoTipo);
    setMotivo(''); // o motivo escolhido pode não existir no outro tipo
    setErroMotivo('');
  }

  // Monta o timestamp (ms) que será salvo
  function calcularData(): number {
    // No navegador não há seletor: usa a data/hora atual
    if (Platform.OS === 'web') return Date.now();
    // No celular: usa o dia escolhido com a hora atual
    const agora = new Date();
    const escolhida = new Date(data);
    escolhida.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds());
    return escolhida.getTime();
  }

  async function salvar() {
    if (!user) return;

    setErroProduto('');
    setErroQuantidade('');
    setErroMotivo('');
    setErroGeral('');

    if (validacao.erros.produto) {
      setErroProduto(validacao.erros.produto);
    }
    if (validacao.erros.quantidade) {
      setErroQuantidade(validacao.erros.quantidade);
    }
    if (validacao.erros.motivo) {
      setErroMotivo(validacao.erros.motivo);
    }

    if (!validacao.valido || !selectedProductId) return;

    const textoQtd = quantidade.trim();
    const qtd = Number(textoQtd);

    setSalvando(true);
    try {
      await registrarMovimentacao(user.uid, {
        produtoId: selectedProductId,
        ...(varianteId && { varianteId }),
        tipo,
        quantidade: qtd,
        motivo,
        data: calcularData(),
      });
      onFechar(); // fecha o modal
      carregarProdutos(user.uid); // atualiza as quantidades dos produtos
      onSalvo(); // avisa a tela para recarregar o histórico
    } catch (e) {
      const mensagem = (e as Error).message;
      if (mensagem.startsWith('Estoque insuficiente')) {
        setErroQuantidade(mensagem); // aparece embaixo do campo quantidade
      } else {
        setErroGeral(mensagem);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onFechar}
      onShow={resetarFormulario}
    >
      <KeyboardAvoidingView
        style={[
          styles.fundo,
          {
            backgroundColor: withOpacity(
              tema === 'dark' ? paleta.fundo : paleta.texto,
              tema === 'dark' ? 0.88 : 0.52,
            ),
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.caixa, { backgroundColor: paleta.card }]}>
          <ScrollView
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.titulo, { color: paleta.texto }]}>Nova movimentação</Text>

            {erroGeral !== '' && (
              <Feedback tipo="erro" mensagem={erroGeral} onFechar={() => setErroGeral('')} />
            )}

            {/* Produto */}
            <Text style={[styles.rotulo, { color: paleta.texto }]}>Produto</Text>
            {produtos.length === 0 ? (
              <Text style={[styles.aviso, { color: paleta.textoSecundario }]}>Nenhum produto cadastrado.</Text>
            ) : (
              <>
                <View
                  style={[
                    styles.buscaProduto,
                    { backgroundColor: paleta.superficie, borderColor: paleta.borda },
                  ]}
                >
                  {selectedProduct ? (
                    <>
                      <View style={styles.produtoSelecionadoInfo}>
                        <Text
                          style={[styles.produtoSelecionadoNome, { color: paleta.texto }]}
                          numberOfLines={1}
                        >
                          {selectedProduct.nome}
                        </Text>
                        <Text style={[styles.produtoSelecionadoEstoque, { color: paleta.textoSecundario }]}>
                          Estoque: {selectedProduct.quantidade}
                        </Text>
                      </View>
                      <Pressable
                        onPress={limparProdutoSelecionado}
                        style={styles.botaoTrocarProduto}
                        accessibilityRole="button"
                        accessibilityLabel="Limpar produto selecionado e voltar à busca"
                      >
                        <Text style={[styles.limparBusca, { color: paleta.primaria }]}>Trocar</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <TextInput
                        ref={searchInputRef}
                        value={searchQuery}
                        onChangeText={(texto) => {
                          setSelectedProductId(null);
                          setSearchQuery(texto);
                          setErroProduto('');
                        }}
                        placeholder="Digite o nome do produto"
                        placeholderTextColor={paleta.desabilitado}
                        style={[styles.campoBuscaProduto, { color: paleta.texto }]}
                        editable={true}
                        accessibilityLabel="Pesquisar produto"
                      />
                      {!!searchQuery && (
                        <Pressable
                          onPress={() => setSearchQuery('')}
                          style={styles.botaoTrocarProduto}
                          accessibilityRole="button"
                          accessibilityLabel="Limpar busca de produto"
                        >
                          <Text style={[styles.limparBusca, { color: paleta.textoSecundario }]}>
                            Limpar
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
                <View style={styles.chips}>
                  <Pressable onPress={() => setCategoriaProduto('')} style={[styles.chip, { backgroundColor: !categoriaProduto ? paleta.primaria : paleta.card, borderColor: !categoriaProduto ? paleta.primaria : paleta.borda }]}>
                    <Text style={[styles.opcaoTexto, { color: !categoriaProduto ? paleta.textoSobreAcao : paleta.texto }]}>Todas</Text>
                  </Pressable>
                  {categorias.map((categoria) => {
                    const ativa = categoriaProduto === categoria;
                    return (
                      <Pressable key={categoria} onPress={() => setCategoriaProduto(ativa ? '' : categoria)} style={[styles.chip, { backgroundColor: ativa ? paleta.primaria : paleta.card, borderColor: ativa ? paleta.primaria : paleta.borda }]}>
                        <Text style={[styles.opcaoTexto, { color: ativa ? paleta.textoSobreAcao : paleta.texto }]}>{categoria}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {sugestoesProduto.length > 0 && (
                  <View style={[styles.listaSugestoes, { backgroundColor: paleta.card, borderColor: paleta.borda }]}>
                    {sugestoesProduto.map((produto) => (
                      <Pressable
                        key={produto.id}
                        onPress={() => {
                          setSelectedProductId(produto.id);
                          setVarianteId('');
                          setSearchQuery('');
                          setErroProduto('');
                        }}
                        style={[
                          styles.sugestaoProduto,
                          { backgroundColor: paleta.card, borderBottomColor: paleta.borda },
                        ]}
                      >
                        <Text style={[styles.opcaoTexto, { color: paleta.texto }]}>{produto.nome} (estoque: {produto.quantidade})</Text>
                        <Text style={[styles.categoriaSugestao, { color: paleta.textoSecundario }]}>{produto.categoria}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {!!searchQuery.trim() && sugestoesProduto.length === 0 && (
                  <Text style={[styles.aviso, { color: paleta.textoSecundario }]}>Nenhum produto encontrado.</Text>
                )}
                {selectedProduct?.variantes && selectedProduct.variantes.length > 0 && (
                  <View>
                    <Text style={[styles.rotulo, { color: paleta.texto }]}>Característica</Text>
                    <View style={styles.chips}>
                      {selectedProduct.variantes.map((variante) => {
                        const indisponivel = tipo === 'saida' && variante.quantidade === 0;
                        const selecionada = varianteId === variante.id;
                        return (
                          <Pressable
                            key={variante.id}
                            disabled={indisponivel}
                            onPress={() => { setVarianteId(variante.id); setErroProduto(''); }}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: selecionada ? paleta.primaria : paleta.card,
                                borderColor: selecionada ? paleta.primaria : paleta.borda,
                              },
                              indisponivel && styles.opcaoIndisponivel,
                            ]}
                          >
                            <Text style={[styles.opcaoTexto, { color: selecionada ? paleta.textoSobreAcao : paleta.texto }]}>
                              {variante.caracteristica} ({variante.quantidade})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}
            {erroProduto !== '' && <Text style={[styles.erro, { color: paleta.erro }]}>{erroProduto}</Text>}

            {/* Tipo */}
            <Text style={[styles.rotulo, { color: paleta.texto }]}>Tipo</Text>
            <View style={styles.linha}>
              <View style={styles.metade}>
                <Botao
                  titulo="Entrada"
                  onPress={() => trocarTipo('entrada')}
                  variante={tipo === 'entrada' ? 'primario' : 'secundario'}
                />
              </View>
              <View style={styles.metade}>
                <Botao
                  titulo="Saída"
                  onPress={() => trocarTipo('saida')}
                  variante={tipo === 'saida' ? 'primario' : 'secundario'}
                />
              </View>
            </View>

            {/* Quantidade */}
            <Input
              label="Quantidade"
              value={quantidade}
              onChangeText={(t) => {
                setQuantidade(t);
                setErroQuantidade('');
              }}
              keyboardType="numeric"
              placeholder="Ex.: 5"
              erro={erroQuantidade}
            />

            {/* Motivo */}
            <Text style={[styles.rotulo, { color: paleta.texto }]}>Motivo</Text>
            <View style={styles.chips}>
              {motivos.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMotivo(m);
                    setErroMotivo('');
                  }}
                  style={[styles.chip, { backgroundColor: motivo === m ? paleta.primaria : paleta.card, borderColor: motivo === m ? paleta.primaria : paleta.borda }]}
                >
                  <Text style={[styles.opcaoTexto, { color: motivo === m ? paleta.textoSobreAcao : paleta.texto }]}>
                    {rotuloMotivo(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {erroMotivo !== '' && <Text style={[styles.erro, { color: paleta.erro }]}>{erroMotivo}</Text>}

            {/* Data: só no celular */}
            {Platform.OS !== 'web' && (
              <View>
                <Text style={[styles.rotulo, { color: paleta.texto }]}>Data</Text>
                <Botao
                  titulo={data.toLocaleDateString('pt-BR')}
                  onPress={() => setMostrarData(true)}
                  variante="secundario"
                />
                {mostrarData && (
                  <DateTimePicker
                    value={data}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(_evento, dataEscolhida) => {
                      // No Android o seletor fecha sozinho; no iOS fica aberto
                      setMostrarData(Platform.OS === 'ios');
                      if (dataEscolhida) setData(dataEscolhida);
                    }}
                  />
                )}
              </View>
            )}
            {Platform.OS === 'web' && (
              <Text style={[styles.aviso, { color: paleta.textoSecundario }]}>A data e a hora atuais serão usadas.</Text>
            )}

            {/* Botões */}
            <View style={styles.acoes}>
              <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
              <Botao
                titulo="Cancelar"
                onPress={onFechar}
                variante="secundario"
                desabilitado={salvando}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  caixa: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
  },
  conteudo: { flexGrow: 1, padding: 20, gap: 8 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  rotulo: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  linha: { flexDirection: 'row', gap: 8 },
  metade: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  opcao: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  buscaProduto: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  campoBuscaProduto: { flex: 1, minWidth: 0, paddingVertical: 10 },
  produtoSelecionadoInfo: { flex: 1, minWidth: 0 },
  produtoSelecionadoNome: { fontSize: 14, fontWeight: '700' },
  produtoSelecionadoEstoque: { fontSize: 12, marginTop: 2 },
  botaoTrocarProduto: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  limparBusca: { fontSize: 13, fontWeight: '700' },
  listaSugestoes: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  sugestaoProduto: { padding: 10, borderBottomWidth: 1 },
  categoriaSugestao: { opacity: 0.65, fontSize: 12, marginTop: 2 },
  opcaoIndisponivel: { opacity: 0.45 },
  opcaoTexto: { fontSize: 14, fontWeight: '600' },
  erro: { fontSize: 13 },
  aviso: { opacity: 0.6, fontSize: 13 },
  acoes: { marginTop: 16, gap: 8 },
});
