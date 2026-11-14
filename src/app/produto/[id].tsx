import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { buscarProduto, buscarPorCodigoBarras } from '../../services/produtosService';
import { cores } from '../../constants/cores';

import Input from '../../components/Input';
import Botao from '../../components/Botao';
import Feedback from '../../components/Feedback';
import Loading from '../../components/Loading';

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
        } else {
          setFeedback({ tipo: 'erro', msg: 'Produto não encontrado.' });
        }
      } catch (error) {
        setFeedback({ tipo: 'erro', msg: 'Erro ao buscar dados do produto.' });
      } finally {
        setCarregandoInicial(false);
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
      };

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
      
      <View style={styles.blocoQuantidade}>
        <Input 
          label="Quantidade Atual" 
          value={quantidade} 
          editable={false} // Regra de negócio: não altera direto aqui
        />
        <Text style={styles.avisoQuantidade}>
          Para alterar a quantidade, registre uma movimentação (entrada/saída).
        </Text>
      </View>

      <Input label="Estoque Mínimo *" value={estoqueMinimo} onChangeText={setEstoqueMinimo} keyboardType="numeric" />
      <Input label="Código de Barras" value={codigoBarras} onChangeText={setCodigoBarras} keyboardType="numeric" />

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
  espacoBotao: {
    height: 12,
  }
});