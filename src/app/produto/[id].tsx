import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { buscarProduto, buscarPorCodigoBarras } from '../../services/produtosService';
import { listarMovimentacoes } from '../../services/movimentacoesService';
import type { Movimentacao, VarianteProduto } from '../../types';
import { cores } from '../../constants/cores';

import Input from '../../components/Input';
import Botao from '../../components/Botao';
import Feedback from '../../components/Feedback';
import Loading from '../../components/Loading';
import CardMovimentacao from '../../components/CardMovimentacao';

export default function EditarProdutoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const produtoId = typeof id === 'string' ? id : id?.[0];
  
  const user = useAuthStore((state: any) => state.user);
  const { editar, remover } = useProdutosStore();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [variantes, setVariantes] = useState<VarianteProduto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
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
      } catch (error) {
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
    
    if (!nome.trim()) return setErroValidacao('O nome é obrigatório.');
    if (!categoria.trim()) return setErroValidacao('A categoria é obrigatória.');
    
    const minNum = parseInt(estoqueMinimo, 10);
    if (isNaN(minNum) || minNum < 0) return setErroValidacao('Estoque mínimo deve ser um número inteiro válido.');

    try {
      setCarregandoAcao(true);

      if (codigoBarras.trim() && user?.uid) {
        const produtoExistente = await buscarPorCodigoBarras(user.uid, codigoBarras.trim());
        // Se achou um produto com esse código E não é o produto atual
        if (produtoExistente && produtoExistente.id !== produtoId) {
          setCarregandoAcao(false);
          return setErroValidacao('Este código de barras já pertence a outro produto.');
        }
      }

      const dados: any = {
        nome: nome.trim(),
        categoria: categoria.trim(),
        estoqueMinimo: minNum,
        ...(variantes.length > 0 && {
          variantes: variantes.map((variante) => ({ ...variante, caracteristica: variante.caracteristica.trim() })),
          quantidade: variantes.reduce((total, variante) => total + variante.quantidade, 0),
        }),
      };

      if (variantes.some((variante) => !variante.caracteristica.trim())) {
        return setErroValidacao('Preencha a característica de cada variação.');
      }
      const nomesVariantes = variantes.map((variante) => variante.caracteristica.trim().toLocaleLowerCase('pt-BR'));
      if (new Set(nomesVariantes).size !== nomesVariantes.length) {
        return setErroValidacao('As características não podem se repetir.');
      }

      if (codigoBarras.trim()) {
        dados.codigoBarras = codigoBarras.trim();
      } else {
        // Se limpou o campo, remove o código de barras
        dados.codigoBarras = null; 
      }

      await editar(user.uid, produtoId, dados);
      
      setFeedback({ tipo: 'sucesso', msg: 'Produto atualizado com sucesso!' });
      setTimeout(() => router.back(), 1500);

    } catch (error) {
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
    } catch (error) {
      setFeedback({ tipo: 'erro', msg: 'Erro ao excluir produto.' });
      setCarregandoAcao(false);
    }
  };

  if (carregandoInicial) return <Loading mensagem="Carregando produto..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {feedback && <Feedback tipo={feedback.tipo} mensagem={feedback.msg} />}
      {erroValidacao ? <Feedback tipo="erro" mensagem={erroValidacao} /> : null}

      <Input label="Nome do Produto *" value={nome} onChangeText={setNome} />
      <Input label="Categoria *" value={categoria} onChangeText={setCategoria} />
      
      {variantes.length === 0 ? <View style={styles.blocoQuantidade}>
        <Input 
          label="Quantidade Atual" 
          value={quantidade} 
          editable={false} // Regra de negócio: não altera direto aqui
        />
        <Text style={styles.avisoQuantidade}>
          Para alterar a quantidade, registre uma movimentação (entrada/saída).
        </Text>
      </View> : (
        <View style={styles.blocoVariantes}>
          <Text style={styles.tituloVariantes}>Características e estoque</Text>
          {variantes.map((variante, indice) => (
            <View key={variante.id} style={styles.linhaVariante}>
              <Input label={`Característica ${indice + 1}`} value={variante.caracteristica} onChangeText={(texto) => setVariantes((atuais) => atuais.map((item) => item.id === variante.id ? { ...item, caracteristica: texto } : item))} />
              <Text style={styles.estoqueVariante}>Estoque: {variante.quantidade}</Text>
              {variante.quantidade === 0 && <Pressable onPress={() => setVariantes((atuais) => atuais.filter((item) => item.id !== variante.id))} style={styles.removerVariante}><Text style={styles.textoRemoverVariante}>Remover característica</Text></Pressable>}
            </View>
          ))}
          <Text style={styles.estoqueTotal}>Estoque total: {variantes.reduce((total, variante) => total + variante.quantidade, 0)}</Text>
        </View>
      )}
      <Pressable onPress={() => {
        const base = variantes.length ? variantes : [{ id: `legado-${Date.now()}`, caracteristica: 'Estoque sem característica', quantidade: Number(quantidade) || 0 }];
        setVariantes([...base, { id: `var-${Date.now()}-${base.length}`, caracteristica: '', quantidade: 0 }]);
      }} style={styles.botaoVariante}>
        <Text style={styles.textoBotaoVariante}>Adicionar característica (cor, tamanho...)</Text>
      </Pressable>

      <Input label="Estoque Mínimo *" value={estoqueMinimo} onChangeText={setEstoqueMinimo} keyboardType="numeric" />
      <Input label="Código de Barras" value={codigoBarras} onChangeText={setCodigoBarras} keyboardType="numeric" />

      <View style={styles.historico}>
        <Text style={styles.tituloHistorico}>Histórico de movimentações</Text>
        <Text style={styles.subtituloHistorico}>Entradas e saídas registradas para este produto.</Text>
        {carregandoHistorico ? (
          <Text style={styles.historicoVazio}>Carregando histórico...</Text>
        ) : erroHistorico ? (
          <Text style={styles.historicoVazio}>{erroHistorico}</Text>
        ) : movimentacoes.length ? (
          movimentacoes.map((movimentacao) => (
            <CardMovimentacao key={movimentacao.id} movimentacao={movimentacao} />
          ))
        ) : (
          <Text style={styles.historicoVazio}>Nenhuma movimentação registrada para este produto.</Text>
        )}
      </View>

      <View style={styles.botoes}>
        <Botao titulo="Salvar Alterações" onPress={handleSalvar} carregando={carregandoAcao} variante="primario" />
        <View style={styles.espacoBotao} />
        <Botao titulo="Excluir Produto" onPress={confirmarExclusao} carregando={carregandoAcao} variante="perigo" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  blocoQuantidade: {
    marginBottom: 8,
  },
  avisoQuantidade: {
    fontSize: 12,
    color: cores.aviso,
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  botoes: {
    marginTop: 24,
  },
  historico: { marginTop: 28 },
  tituloHistorico: { fontSize: 20, fontWeight: '700', color: cores.texto },
  subtituloHistorico: { fontSize: 14, color: cores.texto, opacity: 0.7, marginTop: 4, marginBottom: 16 },
  historicoVazio: { color: cores.texto, opacity: 0.7, paddingVertical: 16, textAlign: 'center' },
  blocoVariantes: { marginTop: 8 },
  tituloVariantes: { fontSize: 15, fontWeight: '700', color: cores.texto, marginBottom: 8 },
  linhaVariante: { borderWidth: 1, borderColor: cores.borda, borderRadius: 10, padding: 12, marginBottom: 8 },
  estoqueVariante: { color: cores.texto, opacity: 0.75, marginBottom: 8 },
  estoqueTotal: { color: cores.texto, fontWeight: '700', marginBottom: 8 },
  botaoVariante: { borderWidth: 1, borderColor: cores.primaria, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  textoBotaoVariante: { color: cores.primaria, fontWeight: '700' },
  removerVariante: { paddingVertical: 6, alignSelf: 'flex-end' },
  textoRemoverVariante: { color: cores.erro, fontSize: 13, fontWeight: '600' },
  espacoBotao: {
    height: 12,
  }
});
