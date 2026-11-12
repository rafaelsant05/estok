import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { cores } from '../../constants/cores';
import Loading from '../../components/Loading';
import Feedback from '../../components/Feedback';
import ResumoCard from '../../components/ResumoCard';
import ItemEstoqueBaixo from '../../components/ItemEstoqueBaixo';

export default function Inicio() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { produtos, carregando, erro, carregar } = useProdutosStore();

  const [atualizando, setAtualizando] = useState(false); // pull to refresh
  const [erroVisivel, setErroVisivel] = useState(true);  // controla o Feedback

  // Carrega os produtos ao abrir a tela
  useEffect(() => {
    if (user?.uid) carregar(user.uid);
  }, [user?.uid]);

  // Pull to refresh: recarrega e esconde o spinner no fim
  async function atualizar() {
    if (!user?.uid) return;
    setAtualizando(true);
    setErroVisivel(true);
    await carregar(user.uid);
    setAtualizando(false);
  }

  // Cálculos do resumo, feitos a partir do store
  const totalProdutos = produtos.length;
  const totalItens = produtos.reduce((soma, p) => soma + p.quantidade, 0);
  const estoqueBaixo = produtos
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .sort((a, b) => a.quantidade - b.quantidade); // mais críticos primeiro

  // Primeira carga (lista vazia): mostra só o Loading
  if (carregando && produtos.length === 0 && !atualizando) {
    return <Loading mensagem="Carregando produtos..." />;
  }

  // Tudo que fica acima da lista (saudação, cards, título)
  const cabecalho = (
    <View>
      {erro && erroVisivel ? (
        <Feedback
          tipo="erro"
          mensagem={String(erro)}
          onFechar={() => setErroVisivel(false)}
        />
      ) : null}

      <Text style={styles.saudacao}>Olá, {user?.email}</Text>

      <View style={styles.cards}>
        <ResumoCard titulo="Produtos" valor={totalProdutos} />
        <ResumoCard titulo="Itens em estoque" valor={totalItens} />
        <ResumoCard
          titulo="Estoque baixo"
          valor={estoqueBaixo.length}
          cor={estoqueBaixo.length > 0 ? cores.erro : cores.sucesso}
        />
      </View>

      <Text style={styles.secao}>Estoque baixo</Text>
    </View>
  );

  // Mensagem quando a lista está vazia (2 casos diferentes)
  const vazio = (
    <Text style={styles.vazio}>
      {totalProdutos === 0
        ? 'Nenhum produto cadastrado ainda'
        : 'Tudo certo! Nenhum produto com estoque baixo.'}
    </Text>
  );

  return (
    <FlatList
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      data={estoqueBaixo}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={vazio}
      renderItem={({ item }) => (
        <ItemEstoqueBaixo
          produto={item}
          onPress={() =>
            router.push({ pathname: '/produto/[id]', params: { id: item.id } })
          }
        />
      )}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={atualizar} />
      }
    />
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16 },
  saudacao: { fontSize: 18, fontWeight: '600', color: cores.texto, marginBottom: 16 },
  cards: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  secao: { fontSize: 16, fontWeight: 'bold', color: cores.texto, marginBottom: 8 },
  vazio: { textAlign: 'center', color: cores.texto, opacity: 0.6, marginTop: 24 },
});