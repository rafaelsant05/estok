import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { buscarPorCodigoBarras } from '../../services/produtosService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import { montarDadosProduto, normalizarCodigoBarras, validarProduto } from '../../utils/negocio';

import Botao from '../../components/Botao';
import CampoCodigoBarras from '../../components/CampoCodigoBarras';
import Feedback from '../../components/Feedback';
import Input from '../../components/Input';

export default function NovoProdutoScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const estoqueMinimoPadrao = useAuthStore((state) =>
    state.perfilUid === state.user?.uid ? state.perfil.defaultMinStock : null,
  );
  const tema = useThemeStore((state) => state.tema);
  const cores = PALETAS_TEMA[tema];
  const { adicionar } = useProdutosStore();
  const params = useLocalSearchParams();

  // Estados dos campos
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const estoqueMinimoEfetivo =
    estoqueMinimo || (estoqueMinimoPadrao !== null ? String(estoqueMinimoPadrao) : '');
  const [codigoBarras, setCodigoBarras] = useState(() => (typeof params.codigoBarras === 'string' ? normalizarCodigoBarras(params.codigoBarras) : ''));
  const [variantes, setVariantes] = useState<{ id: string; caracteristica: string; quantidade: string }[]>([] as { id: string; caracteristica: string; quantidade: string }[]);

  const atualizarVariante = (id: string, dados: Partial<{ id: string; caracteristica: string; quantidade: string }>) => {
    setVariantes((atuais: { id: string; caracteristica: string; quantidade: string }[]) => atuais.map((item) => (item.id === id ? { ...item, ...dados } : item)));
  };

  const removerVariante = (id: string) => {
    setVariantes((atuais: { id: string; caracteristica: string; quantidade: string }[]) => atuais.filter((item) => item.id !== id));
  };

  const adicionarVariante = () => {
    setVariantes((atuais: { id: string; caracteristica: string; quantidade: string }[]) => [...atuais, { id: `${Date.now()}-${atuais.length}`, caracteristica: '', quantidade: '0' }]);
  };

  // Estados de controle
  const [carregando, setCarregando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const handleSalvar = async () => {
    setErroValidacao('');

    const resultado = validarProduto({
      nome,
      categoria,
      quantidade,
      estoqueMinimo: estoqueMinimoEfetivo,
      codigoBarras,
      variantes,
    });

    if (!resultado.valido) {
      const primeiraErro = Object.values(resultado.erros)[0] as string;
      return setErroValidacao(primeiraErro);
    }

    try {
      setCarregando(true);

      const codigoNormalizado = normalizarCodigoBarras(codigoBarras);
      if (codigoNormalizado && user?.uid) {
        const produtoExistente = await buscarPorCodigoBarras(user.uid, codigoNormalizado);
        if (produtoExistente) {
          setCarregando(false);
          return setErroValidacao('Este código de barras já está cadastrado em outro produto.');
        }
      }

      const dados = montarDadosProduto({
        nome,
        categoria,
        quantidade,
        estoqueMinimo: estoqueMinimoEfetivo,
        codigoBarras,
        variantes,
      });

      await adicionar(user.uid, dados);

      setFeedback({ tipo: 'sucesso', msg: 'Produto cadastrado com sucesso!' });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro ao salvar o produto.' });
    } finally {
      setCarregando(false);
    }
  };

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

        <Input label="Nome do Produto *" value={nome} onChangeText={setNome} placeholder="Ex: Cimento 50kg" />
        <Input label="Categoria *" value={categoria} onChangeText={setCategoria} placeholder="Ex: Material de Construção" />
        {variantes.length === 0 ? (
          <Input label="Quantidade Inicial *" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" placeholder="Ex: 10" />
        ) : (
          <View style={styles.blocoVariantes}>
            <Text style={[styles.tituloVariantes, { color: cores.texto }]}>Características e estoque inicial</Text>
            {variantes.map((variante, indice) => (
              <View key={variante.id} style={[styles.linhaVariante, { borderColor: cores.borda }]}>
                <Input label={`Característica ${indice + 1}`} value={variante.caracteristica} onChangeText={(texto) => atualizarVariante(variante.id, { caracteristica: texto })} placeholder="Ex: Vermelha, Azul, 500 ml" />
                <Input label="Quantidade" value={variante.quantidade} onChangeText={(texto) => atualizarVariante(variante.id, { quantidade: texto })} keyboardType="numeric" placeholder="Ex: 10" />
                {variantes.length > 1 && (
                  <Pressable
                    onPress={() => removerVariante(variante.id)}
                    style={styles.removerVariante}
                  >
                    <Text style={[styles.textoRemoverVariante, { color: cores.erro }]}>
                      Remover característica
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
            <Text style={[styles.totalVariantes, { color: cores.texto }]}>Estoque total inicial: {variantes.reduce((total, variante) => total + (Number(variante.quantidade) || 0), 0)}</Text>
          </View>
        )}
        <Pressable
          onPress={() => { if (variantes.length === 0) setQuantidade('0'); adicionarVariante(); }}
          style={[styles.botaoVariante, { borderColor: cores.primaria }]}
        >
          <Text style={[styles.textoBotaoVariante, { color: cores.primaria }]}>{variantes.length ? 'Adicionar característica' : 'Adicionar características (cor, tamanho...)'}</Text>
        </Pressable>
        <Input label="Estoque Mínimo *" value={estoqueMinimoEfetivo} onChangeText={setEstoqueMinimo} keyboardType="numeric" placeholder="Ex: 5" />
        <CampoCodigoBarras
          label="Código de Barras (Opcional)"
          value={codigoBarras}
          onChangeText={(texto) => setCodigoBarras(normalizarCodigoBarras(texto))}
          placeholder="Escaneie ou digite"
          disabled={carregando}
        />

        <View style={styles.botoes}>
          <Botao titulo="Salvar" onPress={handleSalvar} carregando={carregando} variante="primario" />
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
  botoes: {
    marginTop: 24,
  },
  blocoVariantes: { marginTop: 8 },
  tituloVariantes: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  linhaVariante: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  totalVariantes: { fontWeight: '600', marginBottom: 8 },
  botaoVariante: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  textoBotaoVariante: { fontWeight: '700' },
  removerVariante: { paddingVertical: 6, alignSelf: 'flex-end' },
  textoRemoverVariante: { fontSize: 13, fontWeight: '600' },
});
