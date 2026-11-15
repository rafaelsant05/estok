import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { cores } from '../../constants/cores';
import { buscarPorCodigoBarras } from '../../services/produtosService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';

import Botao from '../../components/Botao';
import Feedback from '../../components/Feedback';
import Input from '../../components/Input';

export default function NovoProdutoScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const { adicionar } = useProdutosStore();
  const params = useLocalSearchParams();

  // Estados dos campos
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');

  // Estados de controle
  const [carregando, setCarregando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  // Preenche o código de barras se vier do scanner do Bruno
  useEffect(() => {
    if (params.codigoBarras && typeof params.codigoBarras === 'string') {
      setCodigoBarras(params.codigoBarras);
    }
  }, [params.codigoBarras]);

  const handleSalvar = async () => {
    setErroValidacao('');
    
    // Validações básicas
    if (!nome.trim()) return setErroValidacao('O nome é obrigatório.');
    if (!categoria.trim()) return setErroValidacao('A categoria é obrigatória.');
    
    const qtdNum = parseInt(quantidade, 10);
    const minNum = parseInt(estoqueMinimo, 10);
    
    if (isNaN(qtdNum) || qtdNum < 0) return setErroValidacao('Quantidade deve ser um número inteiro maior ou igual a zero.');
    if (isNaN(minNum) || minNum < 0) return setErroValidacao('Estoque mínimo deve ser um número inteiro maior ou igual a zero.');

    try {
      setCarregando(true);

      // Validação de código de barras único
      if (codigoBarras.trim() && user?.uid) {
        const produtoExistente = await buscarPorCodigoBarras(user.uid, codigoBarras.trim());
        if (produtoExistente) {
          setCarregando(false);
          return setErroValidacao('Este código de barras já está cadastrado em outro produto.');
        }
      }

      // Monta os dados omitindo propriedades undefined para não quebrar o Firestore
      const dados: any = {
        nome: nome.trim(),
        categoria: categoria.trim(),
        quantidade: qtdNum,
        estoqueMinimo: minNum,
      };

      if (codigoBarras.trim()) {
        dados.codigoBarras = codigoBarras.trim();
      }

      await adicionar(user.uid, dados);
      
      setFeedback({ tipo: 'sucesso', msg: 'Produto cadastrado com sucesso!' });
      
      // Aguarda um instante para o usuário ler a mensagem antes de voltar
      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error) {
      setFeedback({ tipo: 'erro', msg: 'Erro ao salvar o produto.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {feedback && <Feedback tipo={feedback.tipo} mensagem={feedback.msg} />}
      {erroValidacao ? <Feedback tipo="erro" mensagem={erroValidacao} /> : null}

      <Input label="Nome do Produto *" value={nome} onChangeText={setNome} placeholder="Ex: Cimento 50kg" />
      <Input label="Categoria *" value={categoria} onChangeText={setCategoria} placeholder="Ex: Material de Construção" />
      <Input label="Quantidade Inicial *" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" placeholder="Ex: 10" />
      <Input label="Estoque Mínimo *" value={estoqueMinimo} onChangeText={setEstoqueMinimo} keyboardType="numeric" placeholder="Ex: 5" />
      <Input label="Código de Barras (Opcional)" value={codigoBarras} onChangeText={setCodigoBarras} keyboardType="numeric" placeholder="Escaneie ou digite" />

      <View style={styles.botoes}>
        <Botao titulo="Salvar" onPress={handleSalvar} carregando={carregando} variante="primario" />
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
  botoes: {
    marginTop: 24,
  }
});