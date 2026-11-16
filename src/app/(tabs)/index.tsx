import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import { THEME_COLORS, withOpacity } from '../../theme/colors';
import { listarMovimentacoes } from '../../services/movimentacoesService';
import type { Movimentacao, Produto } from '../../types';
import Loading from '../../components/Loading';
import Feedback from '../../components/Feedback';
import ResumoCard from '../../components/ResumoCard';
import ItemEstoqueBaixo from '../../components/ItemEstoqueBaixo';
import Botao from '../../components/Botao';
import FormMovimentacao from '../../components/FormMovimentacao';
import { notificarEstoqueBaixo } from '../../services/notificacoes';

function obterSaudacao(data: Date) {
  const hora = data.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function obterNomeAmigavel(displayName?: string | null, email?: string | null) {
  const nomeDoEmail = email
    ?.split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const nome = displayName?.trim() || nomeDoEmail || 'Usuário';
  return nome.charAt(0).toLocaleUpperCase('pt-BR') + nome.slice(1);
}

function formatarData(data: Date) {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(data);
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1);
}

export default function Inicio() {
  const navigation = useNavigation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const perfil = useAuthStore((s) =>
    s.perfilUid === s.user?.uid ? s.perfil : null,
  );
  const logout = useAuthStore((s) => s.logout);
  const { produtos, carregando, erro, carregar } = useProdutosStore();
  const tema = useThemeStore((s) => s.tema);
  const cores = PALETAS_TEMA[tema];
  const colors = THEME_COLORS[tema];
  const fotoUsuario = perfil?.photoUrl || user?.photoURL;
  const agora = new Date();
  const nomeUsuario = obterNomeAmigavel(
    perfil?.displayName || user?.displayName,
    user?.email,
  );
  const saudacao = obterSaudacao(agora);
  const dataAtual = formatarData(agora);
  const subtituloPerfil =
    [perfil?.role, perfil?.storeName].filter(Boolean).join(' • ') ||
    'Resumo do seu estoque';

  const [atualizando, setAtualizando] = useState(false); // pull to refresh
  const [erroVisivel, setErroVisivel] = useState(true);
  const [movimentacoesRecentes, setMovimentacoesRecentes] = useState<Movimentacao[]>([]);
  const [erroMovimentacoes, setErroMovimentacoes] = useState<string | null>(null);
  const [alertasAberto, setAlertasAberto] = useState(false);
  const [reporAberto, setReporAberto] = useState(false);
  const [produtoReposicao, setProdutoReposicao] = useState<Produto | null>(null);

  useLayoutEffect(() => {
    async function sairDaConta() {
      try {
        await signOut(auth);
        await logout({ firebaseJaDesconectado: true });
      } catch {
        Alert.alert('Erro ao sair', 'Não foi possível desconectar. Tente novamente.');
      }
    }

    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={() =>
            Alert.alert('Sair da conta', 'Deseja realmente desconectar?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: () => void sairDaConta() },
            ])
          }
          style={styles.botaoSair}
        >
          <Ionicons name="log-out-outline" size={18} color={cores.primaria} />
          <Text style={[styles.textoSair, { color: cores.primaria }]}>Sair</Text>
        </Pressable>
      ),
    });
  }, [logout, navigation, cores.primaria]);

  const carregarAtividade = useCallback(async (uid: string) => {
    try {
      setErroMovimentacoes(null);
      setMovimentacoesRecentes((await listarMovimentacoes(uid)).slice(0, 5));
    } catch (e) {
      setErroMovimentacoes(
        e instanceof Error ? e.message : 'Não foi possível carregar a atividade recente.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      void carregar(user.uid).catch(() => undefined);
      void carregarAtividade(user.uid);
    }, [carregar, carregarAtividade, user]),
  );

  // Pull to refresh: recarrega e esconde o spinner no fim
  async function atualizar() {
    if (!user?.uid) return;
    setAtualizando(true);
    setErroVisivel(true);
    try {
      await Promise.all([
        carregar(user.uid).catch(() => undefined),
        carregarAtividade(user.uid),
      ]);
    } finally {
      setAtualizando(false);
    }
  }

  // Cálculos do resumo, feitos a partir do store
  const totalProdutos = produtos.length;
  const totalItens = produtos.reduce((soma, p) => soma + p.quantidade, 0);
  const estoqueBaixo = useMemo(
    () =>
      produtos
        .filter((p) => p.quantidade <= p.estoqueMinimo)
        .sort((a, b) => a.quantidade - b.quantidade),
    [produtos],
  );

  // Avisa sobre estoque baixo (só depois de carregar).
  // Fica ANTES do return condicional, porque hooks não podem vir depois dele.
  useEffect(() => {
    if (!carregando && estoqueBaixo.length > 0) {
      notificarEstoqueBaixo(estoqueBaixo);
    }
  }, [carregando, estoqueBaixo]);

  // Primeira carga (lista vazia): mostra só o Loading
  if (carregando && produtos.length === 0 && !atualizando) {
    return <Loading mensagem="Carregando produtos..." />;
  }

  // Tudo que fica acima da lista (saudação, cards, botão, título)
  const cabecalho = (
    <View>
      {erro && erroVisivel ? (
        <Feedback
          tipo="erro"
          mensagem={String(erro)}
          onFechar={() => setErroVisivel(false)}
        />
      ) : null}

      <View
        style={[
          styles.cabecalhoSaudacao,
          { borderColor: cores.borda, backgroundColor: cores.card },
        ]}
      >
        <Pressable
          style={styles.perfilTopo}
          onPress={() => router.push('/(tabs)/configuracoes')}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações do perfil"
        >
          {fotoUsuario ? (
            <Image source={{ uri: fotoUsuario }} style={styles.avatarImagem} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: cores.superficie }]}>
              <Text style={[styles.avatarInicial, { color: cores.primaria }]}>
                {nomeUsuario.charAt(0).toLocaleUpperCase('pt-BR')}
              </Text>
            </View>
          )}
          <View style={styles.textosSaudacao}>
            <Text style={[styles.saudacao, { color: cores.texto }]} numberOfLines={1}>
              {saudacao}, {nomeUsuario}
            </Text>
            <Text style={[styles.dataAtual, { color: cores.textoSecundario }]}>{dataAtual}</Text>
            <Text style={[styles.subtitulo, { color: cores.textoSecundario }]} numberOfLines={1}>
              {subtituloPerfil}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.botaoNotificacoes}
          onPress={() => setAlertasAberto(true)}
          accessibilityRole="button"
          accessibilityLabel={`Abrir alertas de estoque, ${estoqueBaixo.length} itens críticos`}
        >
          <Ionicons name="notifications-outline" size={22} color={cores.icone} />
          {estoqueBaixo.length > 0 && (
            <View style={[styles.pontoNotificacao, { backgroundColor: cores.erro }]} />
          )}
        </Pressable>
      </View>

      <View style={styles.resumoTopo}>
        <Text style={[styles.rotuloResumo, { color: cores.textoSecundario }]}>
          Resumo do seu estoque
        </Text>
        <View style={styles.cards}>
          <ResumoCard
            titulo="Produtos"
            valor={totalProdutos}
            icone="cube-outline"
            onPress={() => router.push('/(tabs)/produtos')}
          />
          <ResumoCard
            titulo="Em estoque"
            valor={totalItens}
            icone="layers-outline"
            onPress={() => router.push('/(tabs)/produtos')}
          />
          <ResumoCard
            titulo="Estoque baixo"
            valor={estoqueBaixo.length}
            icone="alert-circle-outline"
            cor={estoqueBaixo.length > 0 ? cores.aviso : cores.sucesso}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/produtos',
                params: { estoqueBaixo: '1' },
              })
            }
          />
        </View>
      </View>

      <View style={styles.botaoScanner}>
        <Botao
          titulo="Escanear código de barras"
          icone="barcode-outline"
          onPress={() => router.push('/scanner')}
        />
      </View>

      <Text
        style={[styles.secao, { color: cores.texto }]}
      >
        Estoque baixo
      </Text>
    </View>
  );

  // Mensagem quando a lista está vazia (2 casos diferentes)
  const vazio = (
    <Text style={[styles.vazio, { color: cores.textoSecundario }]}>
      {totalProdutos === 0
        ? 'Nenhum produto cadastrado ainda'
        : 'Tudo certo! Nenhum produto com estoque baixo.'}
    </Text>
  );

  return (
    <>
    <FlatList
      style={[styles.tela, { backgroundColor: cores.fundo }]}
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
          onRepor={() => {
            setProdutoReposicao(item);
            setReporAberto(true);
          }}
        />
      )}
      ListFooterComponent={
        <View style={[styles.atividade, { borderTopColor: cores.borda }]}>
          <View style={styles.tituloAtividade}>
            <Text style={[styles.secao, { color: cores.texto }]}>Atividade recente</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/movimentacoes')}
              accessibilityRole="button"
              accessibilityLabel="Ver todas as movimentações"
            >
              <Text style={[styles.verTodas, { color: cores.primaria }]}>Ver todas</Text>
            </Pressable>
          </View>
          {erroMovimentacoes ? (
            <Feedback tipo="erro" mensagem={erroMovimentacoes} />
          ) : movimentacoesRecentes.length > 0 ? (
            movimentacoesRecentes.map((movimentacao) => {
              const entrada = movimentacao.tipo === 'entrada';
              const corMovimentacao = entrada ? cores.sucesso : cores.erro;
              return (
                <View
                  key={movimentacao.id}
                  style={[
                    styles.itemAtividade,
                    { backgroundColor: cores.card, borderColor: cores.borda },
                  ]}
                >
                  <Ionicons
                    name={entrada ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={24}
                    color={corMovimentacao}
                  />
                  <View style={styles.detalheAtividade}>
                    <Text style={[styles.nomeAtividade, { color: cores.texto }]} numberOfLines={1}>
                      {movimentacao.produtoNome}
                    </Text>
                    <Text style={[styles.dataAtividade, { color: cores.textoSecundario }]}>
                      {new Date(movimentacao.data).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.quantidadeAtividade, { color: corMovimentacao }]}>
                    {entrada ? '+' : '-'}{movimentacao.quantidade}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={[styles.vazioAtividade, { color: cores.textoSecundario }]}>
              Nenhuma movimentação recente.
            </Text>
          )}
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={atualizar} />
      }
    />
    <Modal
      visible={alertasAberto}
      transparent
      animationType="fade"
      onRequestClose={() => setAlertasAberto(false)}
    >
      <SafeAreaView
        style={[
          styles.alertasOverlay,
          {
            backgroundColor: withOpacity(
              tema === 'dark' ? colors.background : colors.textPrimary,
              tema === 'dark' ? 0.88 : 0.52,
            ),
          },
        ]}
      >
        <View
          style={[
            styles.alertasModal,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              height: estoqueBaixo.length > 0 ? '82%' : undefined,
            },
          ]}
        >
          <View style={styles.alertasCabecalho}>
            <View style={styles.alertasTituloGrupo}>
              <Text style={[styles.alertasTitulo, { color: colors.textPrimary }]}>
                Alertas de Estoque
              </Text>
              <View
                style={[
                  styles.alertasContagem,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.alertasContagemTexto,
                    {
                      color: estoqueBaixo.length > 0
                        ? colors.error
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {estoqueBaixo.length}{' '}
                  {estoqueBaixo.length === 1 ? 'item crítico' : 'itens críticos'}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.botaoFecharAlertas, { backgroundColor: colors.background }]}
              onPress={() => setAlertasAberto(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar alertas de estoque"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {estoqueBaixo.length > 0 ? (
            <FlatList
              data={estoqueBaixo}
              keyExtractor={(item) => item.id}
              style={styles.listaAlertas}
              contentContainerStyle={styles.conteudoAlertas}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ItemEstoqueBaixo
                  produto={item}
                  onPress={() => {
                    setAlertasAberto(false);
                    router.push({ pathname: '/produto/[id]', params: { id: item.id } });
                  }}
                  onRepor={() => {
                    setAlertasAberto(false);
                    setProdutoReposicao(item);
                    setReporAberto(true);
                  }}
                />
              )}
            />
          ) : (
            <View style={styles.alertasVazio}>
              <View
                style={[
                  styles.alertasIconeVazio,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={42} color={colors.primary} />
              </View>
              <Text style={[styles.alertasMensagemVazia, { color: colors.textPrimary }]}>
                Tudo em dia! Nenhum produto com estoque baixo no momento.
              </Text>
              <Text style={[styles.alertasAjudaVazia, { color: colors.textSecondary }]}>
                Seus produtos estão dentro do nível mínimo configurado.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
    <FormMovimentacao
      visible={reporAberto}
      produtoInicialId={produtoReposicao?.id}
      tipoInicial="entrada"
      onFechar={() => {
        setReporAberto(false);
        setProdutoReposicao(null);
      }}
      onSalvo={() => {
        setReporAberto(false);
        setProdutoReposicao(null);
        if (user?.uid) void carregarAtividade(user.uid);
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cabecalhoSaudacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  perfilTopo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  botaoNotificacoes: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pontoNotificacao: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImagem: { width: 52, height: 52, borderRadius: 26 },
  avatarInicial: { fontSize: 22, fontWeight: '800' },
  textosSaudacao: { flex: 1 },
  saudacao: { fontSize: 17, fontWeight: '700' },
  dataAtual: { marginTop: 4, fontSize: 12 },
  subtitulo: { marginTop: 2, fontSize: 12 },
  resumoTopo: { marginBottom: 18 },
  rotuloResumo: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
  },
  textoSair: { fontSize: 14, fontWeight: '600' },
  cards: { flexDirection: 'row', gap: 8 },
  botaoScanner: { marginBottom: 22 },
  secao: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  vazio: { textAlign: 'center', marginTop: 24, fontSize: 14, opacity: 0.75 },
  alertasOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alertasModal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
  alertasCabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  alertasTituloGrupo: { flex: 1 },
  alertasTitulo: { fontSize: 20, fontWeight: '800' },
  alertasContagem: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  alertasContagemTexto: { fontSize: 12, fontWeight: '700' },
  botaoFecharAlertas: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  listaAlertas: { flex: 1 },
  conteudoAlertas: { paddingBottom: 4 },
  alertasVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 230,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  alertasIconeVazio: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertasMensagemVazia: {
    maxWidth: 320,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
  },
  alertasAjudaVazia: {
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  atividade: { marginTop: 18, paddingTop: 18, borderTopWidth: 1 },
  tituloAtividade: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verTodas: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  itemAtividade: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  detalheAtividade: { flex: 1 },
  nomeAtividade: { fontSize: 14, fontWeight: '600' },
  dataAtividade: { fontSize: 11, marginTop: 3 },
  quantidadeAtividade: { fontSize: 16, fontWeight: '800' },
  vazioAtividade: { fontSize: 13, paddingVertical: 8 },
});