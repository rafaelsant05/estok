import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { buscarProduto, buscarPorCodigoBarras } from '../../services/produtosService';
import { listarMovimentacoes } from '../../services/movimentacoesService';
import type { Movimentacao, VarianteProduto } from '../../types';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import { montarDadosProduto, normalizarCodigoBarras, validarProduto } from '../../utils/negocio';

import Input from '../../components/Input';
import Botao from '../../components/Botao';
import CampoCodigoBarras from '../../components/CampoCodigoBarras';
import Feedback from '../../components/Feedback';
import Loading from '../../components/Loading';
import CardMovimentacao from '../../components/CardMovimentacao';

export default function EditarProdutoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const produtoId = typeof id === 'string' ? id : id?.[0];
  
  const user = useAuthStore((state: any) => state.user);
  const tema = useThemeStore((state) => state.tema);
  const cores = PALETAS_TEMA[tema];
  const { editar, remover } = useProdutosStore();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [variantes, setVariantes] = useState<VarianteProduto[]>([] as VarianteProduto[]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);

  const atualizarVariante = (id: string, dados: Partial<VarianteProduto>) => {
    setVariantes((atuais: VarianteProduto[]) => atuais.map((item) => (item.id === id ? { ...item, ...dados } : item)));
  };

  const removerVariante = (id: string) => {
    setVariantes((atuais: VarianteProduto[]) => atuais.filter((item) => item.id !== id));
  };

  const adicionarVariante = () => {
    const novaVariante: VarianteProduto = { id: `var-${Date.now()}-${variantes.length}`, caracteristica: '', quantidade: 0 };
    setVariantes((atuais: VarianteProduto[]) => [...atuais, novaVariante]);
  };
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [erroHistorico, setErroHistorico] = useState('');

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoAcao, setCarregandoAcao] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; msg: string } | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      if (!user?.uid || !produtoId) return;
      try {
        const prod = await buscarProduto(user.uid, produtoId);
        if (prod) {
          setNome(prod.nome);
          setCategoria(prod.categoria);
          setQuantidade(prod.quantidade.toString());
          setEstoqueMinimo(prod.estoqueMinimo.toString());
          setCodigoBarras(prod.codigoBarras || '');
          setVariantes(prod.variantes || []);
        } else {
          setFeedback({ tipo: 'erro', msg: 'Produto não encontrado.' });
        }
        try {
          setMovimentacoes(await listarMovimentacoes(user.uid, produtoId));
        } catch (error) {
          setErroHistorico(error instanceof Error ? error.message : 'Erro ao carregar historico.');
        }
      } catch {
        setFeedback({ tipo: 'erro', msg: 'Erro ao buscar dados do produto.' });
      } finally {
        setCarregandoInicial(false);
        setCarregandoHistorico(false);
      }
    };
    carregarDados();
  }, [user?.uid, produtoId]);

  const handleSalvar = async () => {
    if (!produtoId) return;
    setErroValidacao('');

    const resultado = validarProduto({
      nome,
      categoria,
      quantidade: variantes.length > 0 ? variantes.reduce((total, variante) => total + Number(variante.quantidade || 0), 0) : quantidade,
      estoqueMinimo,
      codigoBarras,
      variantes,
    });

    if (!resultado.valido) {
      const primeiraErro = Object.values(resultado.erros)[0] as string;
      return setErroValidacao(primeiraErro);
    }

    try {
      setCarregandoAcao(true);

      const codigoNormalizado = normalizarCodigoBarras(codigoBarras);
      if (codigoNormalizado && user?.uid) {
        const produtoExistente = await buscarPorCodigoBarras(user.uid, codigoNormalizado);
        if (produtoExistente && produtoExistente.id !== produtoId) {
          setCarregandoAcao(false);
          return setErroValidacao('Este código de barras já pertence a outro produto.');
        }
      }

      const dados = montarDadosProduto({
        nome,
        categoria,
        quantidade: variantes.length > 0 ? variantes.reduce((total, variante) => total + Number(variante.quantidade || 0), 0) : quantidade,
        estoqueMinimo,
        codigoBarras,
        variantes,
      });

      await editar(user.uid, produtoId, dados);

      setFeedback({ tipo: 'sucesso', msg: 'Produto atualizado com sucesso!' });
      setTimeout(() => router.back(), 1500);
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro ao atualizar o produto.' });
    } finally {
      setCarregandoAcao(false);
    }
  };

  const confirmarExclusao = () => {
    const mensagem = 'Tem certeza que deseja excluir este produto permanentemente?';
    
    if (Platform.OS === 'web') {
      if (window.confirm(mensagem)) {
        executarExclusao();
      }
    } else {
      Alert.alert('Atenção', mensagem, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: executarExclusao }
      ]);
    }
  };

  const executarExclusao = async () => {
    if (!user?.uid || !produtoId) return;
    try {
      setCarregandoAcao(true);
      await remover(user.uid, produtoId);
      router.back();
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro ao excluir produto.' });
      setCarregandoAcao(false);
    }
  };

  if (carregandoInicial) return <Loading mensagem="Carregando produto..." />;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: cores.fundo }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: cores.fundo }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {feedback && <Feedback tipo={feedback.tipo} mensagem={feedback.msg} />}
        {erroValidacao ? <Feedback tipo="erro" mensagem={erroValidacao} /> : null}

        <Input label="Nome do Produto *" value={nome} onChangeText={setNome} />
        <Input label="Categoria *" value={categoria} onChangeText={setCategoria} />
        {variantes.length === 0 ? (
          <View style={styles.blocoQuantidade}>
            <Input
              label="Quantidade Atual"
              value={quantidade}
              editable={false}
            />
            <Text style={[styles.avisoQuantidade, { color: cores.aviso }]}>
              Para alterar a quantidade, registre uma movimentação (entrada/saída).
            </Text>
          </View>
        ) : (
          <View style={styles.blocoVariantes}>
            <Text style={[styles.tituloVariantes, { color: cores.texto }]}>Características e estoque</Text>
            {variantes.map((variante, indice) => (
              <View key={variante.id} style={[styles.linhaVariante, { borderColor: cores.borda }]}>
                <Input
                  label={`Característica ${indice + 1}`}
                  value={variante.caracteristica}
                  onChangeText={(texto) =>
                    atualizarVariante(variante.id, { caracteristica: texto })
                  }
                />
                <Text style={[styles.estoqueVariante, { color: cores.textoSecundario }]}>Estoque: {variante.quantidade}</Text>
                {variantes.length > 1 && variante.quantidade === 0 && (
                  <Pressable
                    onPress={() => removerVariante(variante.id)}
                    style={styles.removerVariante}
                  >
                    <Text style={[styles.textoRemoverVariante, { color: cores.erro }]}>Remover característica</Text>
                  </Pressable>
                )}
              </View>
            ))}
            <Text style={[styles.estoqueTotal, { color: cores.texto }]}>
              Estoque total: {variantes.reduce((total, variante) => total + variante.quantidade, 0)}
            </Text>
          </View>
        )}
        <Pressable onPress={adicionarVariante} style={[styles.botaoVariante, { borderColor: cores.primaria }]}>
          <Text style={[styles.textoBotaoVariante, { color: cores.primaria }]}>Adicionar característica (cor, tamanho...)</Text>
        </Pressable>

        <Input
          label="Estoque Mínimo *"
          value={estoqueMinimo}
          onChangeText={setEstoqueMinimo}
          keyboardType="numeric"
        />
        <CampoCodigoBarras
          label="Código de Barras (Opcional)"
          value={codigoBarras}
          onChangeText={(texto) => setCodigoBarras(normalizarCodigoBarras(texto))}
          placeholder="Escaneie ou digite"
          disabled={carregandoAcao}
        />

        <View style={styles.historico}>
          <Text style={[styles.tituloHistorico, { color: cores.texto }]}>Histórico de movimentações</Text>
          <Text style={[styles.subtituloHistorico, { color: cores.textoSecundario }]}>
            Entradas e saídas registradas para este produto.
          </Text>
          {carregandoHistorico ? (
            <Text style={[styles.historicoVazio, { color: cores.textoSecundario }]}>Carregando histórico...</Text>
          ) : erroHistorico ? (
            <Text style={[styles.historicoVazio, { color: cores.textoSecundario }]}>{erroHistorico}</Text>
          ) : movimentacoes.length ? (
            movimentacoes.map((movimentacao) => (
              <CardMovimentacao key={movimentacao.id} movimentacao={movimentacao} />
            ))
          ) : (
            <Text style={[styles.historicoVazio, { color: cores.textoSecundario }]}>
              Nenhuma movimentação registrada para este produto.
            </Text>
          )}
        </View>

        <View style={styles.botoes}>
          <Botao
            titulo="Salvar Alterações"
            onPress={handleSalvar}
            carregando={carregandoAcao}
            variante="primario"
          />
          <View style={styles.espacoBotao} />
          <Botao
            titulo="Excluir Produto"
            onPress={confirmarExclusao}
            carregando={carregandoAcao}
            variante="perigo"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  blocoQuantidade: {
    marginBottom: 8,
  },
  avisoQuantidade: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  botoes: {
    marginTop: 24,
  },
  historico: { marginTop: 28 },
  tituloHistorico: { fontSize: 20, fontWeight: '700' },
  subtituloHistorico: { fontSize: 14, opacity: 0.85, marginTop: 4, marginBottom: 16 },
  historicoVazio: { opacity: 0.85, paddingVertical: 16, textAlign: 'center' },
  blocoVariantes: { marginTop: 8 },
  tituloVariantes: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  linhaVariante: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  estoqueVariante: { opacity: 0.9, marginBottom: 8 },
  estoqueTotal: { fontWeight: '700', marginBottom: 8 },
  botaoVariante: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  textoBotaoVariante: { fontWeight: '700' },
  removerVariante: { paddingVertical: 6, alignSelf: 'flex-end' },
  textoRemoverVariante: { fontSize: 13, fontWeight: '600' },
  espacoBotao: {
    height: 12,
  }
});
