import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Botao from '../../components/Botao';
import Feedback from '../../components/Feedback';
import Input from '../../components/Input';
import { PerfilUsuario, criarPerfilPadrao, useAuthStore } from '../../store/useAuthStore';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import { salvarFotoPerfil, salvarPerfilUsuario } from '../../services/perfilService';

const PERFIL_VAZIO = criarPerfilPadrao();

export default function ConfiguracoesScreen() {
  const carregandoPerfil = useAuthStore((estado) => estado.carregandoPerfil);
  const user = useAuthStore((estado) => estado.user);
  const perfil = useAuthStore((estado) =>
    estado.perfilUid === estado.user?.uid ? estado.perfil : PERFIL_VAZIO,
  );
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  if (carregandoPerfil) {
    return (
      <SafeAreaView
        style={[styles.tela, styles.carregandoTela, { backgroundColor: cores.fundo }]}
        edges={['left', 'right']}
      >
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={{ color: cores.textoSecundario, marginTop: 10 }}>
          Sincronizando perfil...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <FormularioConfiguracoes
      key={user?.uid ?? 'sem-usuario'}
      user={user}
      perfilInicial={perfil}
    />
  );
}

function FormularioConfiguracoes({
  user,
  perfilInicial,
}: {
  user: User | null;
  perfilInicial: PerfilUsuario;
}) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<PerfilUsuario>(perfilInicial);
  const erroPerfil = useAuthStore((estado) => estado.erroPerfil);
  const definirPerfil = useAuthStore((estado) => estado.setPerfil);
  const definirErroPerfil = useAuthStore((estado) => estado.setErroPerfil);
  const logout = useAuthStore((estado) => estado.logout);
  const definirTema = useThemeStore((estado) => estado.setTema);
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro' | 'aviso';
    mensagem: string;
  } | null>(null);

  function atualizar<K extends keyof PerfilUsuario>(
    campo: K,
    valor: PerfilUsuario[K],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function escolherFoto() {
    if (!user) return;

    try {
      setFeedback(null);
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        setFeedback({
          tipo: 'erro',
          mensagem: 'Permita o acesso à galeria para escolher uma foto.',
        });
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (resultado.canceled) return;

      const foto = resultado.assets[0];
      setCarregandoFoto(true);
      const envio = await salvarFotoPerfil(
        user.uid,
        foto.uri,
        foto.base64,
        foto.mimeType,
      );
      atualizar('photoUrl', envio.photoUrl);
      setFeedback(
        envio.erro
          ? {
              tipo: 'aviso',
              mensagem: 'A foto ficará salva neste dispositivo; não foi possível enviá-la ao Firebase Storage.',
            }
          : null,
      );
    } catch {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível escolher a foto. Tente novamente.',
      });
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function salvar() {
    if (!user) return;
    setFeedback(null);

    if (!formulario.displayName.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe o nome de usuário.' });
      return;
    }
    if (
      formulario.defaultMinStock !== null &&
      (!Number.isSafeInteger(formulario.defaultMinStock) || formulario.defaultMinStock < 0)
    ) {
      setFeedback({
        tipo: 'erro',
        mensagem: 'O estoque mínimo padrão deve ser um número inteiro igual ou maior que zero.',
      });
      return;
    }

    const perfil: PerfilUsuario = {
      ...formulario,
      displayName: formulario.displayName.trim(),
      storeName: formulario.storeName.trim(),
    };

    setSalvando(true);
    try {
      const resultado = await salvarPerfilUsuario(user.uid, perfil);
      definirPerfil(user.uid, perfil);
      if (resultado.sincronizado) {
        definirErroPerfil(null);
        const fotoSomenteLocal =
          !!perfil.photoUrl && !perfil.photoUrl.startsWith('http');
        setFeedback({
          tipo: fotoSomenteLocal
            ? 'aviso'
            : 'sucesso',
          mensagem: fotoSomenteLocal
            ? 'Perfil sincronizado. A foto está disponível apenas neste dispositivo.'
            : 'Alterações salvas com sucesso!',
        });
      } else {
        definirErroPerfil('A sincronização com o Firebase falhou; os dados foram mantidos neste dispositivo.');
        setFeedback({
          tipo: 'aviso',
          mensagem: 'Dados salvos neste dispositivo, mas não foi possível sincronizá-los com o Firebase.',
        });
      }
    } catch {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível salvar as alterações neste dispositivo.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function sairDaConta() {
    if (saindo) return;
    setSaindo(true);
    const uid = user?.uid;

    try {
      await signOut(auth);
      await logout({ firebaseJaDesconectado: true, uid });
      router.replace('/(auth)/login');
    } catch {
      const sessaoEncerrada = !useAuthStore.getState().user;
      if (sessaoEncerrada) router.replace('/(auth)/login');

      const mensagem = sessaoEncerrada
        ? 'Você saiu da conta, mas não foi possível limpar os dados salvos neste dispositivo.'
        : 'Não foi possível desconectar. Tente novamente.';
      if (Platform.OS === 'web') {
        window.alert(mensagem);
      } else {
        Alert.alert(sessaoEncerrada ? 'Dados locais' : 'Erro ao sair', mensagem);
      }
    } finally {
      setSaindo(false);
    }
  }

  function confirmarSaida() {
    const mensagem = 'Deseja realmente desconectar?';
    if (Platform.OS === 'web') {
      if (window.confirm(`Sair da conta\n\n${mensagem}`)) void sairDaConta();
      return;
    }

    Alert.alert('Sair da conta', mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sairDaConta() },
    ]);
  }

  const inicial =
    formulario.displayName.trim().charAt(0).toLocaleUpperCase('pt-BR') ||
    user?.email?.charAt(0).toLocaleUpperCase('pt-BR') ||
    '?';
  const versao = Constants.expoConfig?.version ?? '—';

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: cores.fundo }]}
      edges={['left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          {!!erroPerfil && (
            <Feedback tipo="aviso" mensagem={erroPerfil} />
          )}
          {feedback && (
            <Feedback tipo={feedback.tipo} mensagem={feedback.mensagem} />
          )}

          <View style={[styles.secao, { backgroundColor: cores.card, borderColor: cores.borda }]}>
            <Text style={[styles.tituloSecao, { color: cores.texto }]}>Perfil</Text>
            <Pressable
              style={[styles.avatar, { backgroundColor: cores.superficie }]}
              onPress={() => void escolherFoto()}
              disabled={carregandoFoto || salvando}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto de perfil"
            >
              {formulario.photoUrl ? (
                <Image source={{ uri: formulario.photoUrl }} style={styles.foto} />
              ) : (
                <Text style={[styles.inicial, { color: cores.primaria }]}>{inicial}</Text>
              )}
              <View
                style={[
                  styles.iconeFoto,
                  { backgroundColor: cores.primaria, borderColor: cores.card },
                ]}
              >
                {carregandoFoto ? (
                  <ActivityIndicator size="small" color={cores.textoSobreAcao} />
                ) : (
                  <Ionicons name="camera-outline" size={16} color={cores.textoSobreAcao} />
                )}
              </View>
            </Pressable>

            <Input
              label="Nome de usuário"
              value={formulario.displayName}
              onChangeText={(valor) => atualizar('displayName', valor)}
              placeholder="Seu nome"
              editable={!salvando}
            />
            <Input
              label="E-mail"
              value={user?.email ?? ''}
              editable={false}
            />
            <Input
              label="Nome da loja/unidade (opcional)"
              value={formulario.storeName}
              onChangeText={(valor) => atualizar('storeName', valor)}
              placeholder="Ex.: Estok Centro"
              editable={!salvando}
            />
          </View>

          <View style={[styles.secao, { backgroundColor: cores.card, borderColor: cores.borda }]}>
            <Text style={[styles.tituloSecao, { color: cores.texto }]}>Preferências</Text>
            <Text style={[styles.rotulo, { color: cores.texto }]}>Aparência</Text>
            <View style={styles.temas}>
              {([
                ['light', 'Claro', 'sunny-outline'],
                ['dark', 'Escuro', 'moon-outline'],
              ] as const).map(([valor, rotulo, icone]) => {
                const ativo = tema === valor;
                return (
                  <Pressable
                    key={valor}
                    onPress={() => definirTema(valor)}
                    style={[
                      styles.opcaoTema,
                      {
                        backgroundColor: ativo ? cores.superficie : cores.card,
                        borderColor: ativo ? cores.primaria : cores.borda,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <Ionicons name={icone} size={20} color={ativo ? cores.primaria : cores.icone} />
                    <Text style={[styles.textoTema, { color: cores.texto }]}>{rotulo}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Input
              label="Estoque mínimo padrão (opcional)"
              value={formulario.defaultMinStock === null ? '' : String(formulario.defaultMinStock)}
              onChangeText={(valor) => {
                const digitos = valor.replace(/\D/g, '');
                atualizar('defaultMinStock', digitos ? Number(digitos) : null);
              }}
              placeholder="Ex.: 5"
              keyboardType="number-pad"
              editable={!salvando}
            />
          </View>

          <View style={styles.acoes}>
            <Botao
              titulo="Salvar alterações"
              onPress={() => void salvar()}
              carregando={salvando}
              desabilitado={!user}
              icone="save-outline"
            />
            <View style={styles.espaco} />
            <Botao
              titulo="Sair da conta"
              onPress={confirmarSaida}
              carregando={saindo}
              variante="perigo"
              icone="log-out-outline"
            />
          </View>

          <Text style={[styles.versao, { color: cores.textoSecundario }]}>
            Estok • versão {versao}
          </Text>
          <Text style={[styles.rodape, { color: cores.textoSecundario }]}>
            © 2026 Estok • Desenvolvido por Rafael Carvalho, Rickson Figueiredo, Jonathan Marinho e Bruno França
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  carregandoTela: { alignItems: 'center', justifyContent: 'center' },
  teclado: { flex: 1 },
  conteudo: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  secao: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tituloSecao: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  foto: { width: '100%', height: '100%', borderRadius: 46 },
  inicial: { fontSize: 36, fontWeight: '800' },
  iconeFoto: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  rotulo: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  temas: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  opcaoTema: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  textoTema: { fontWeight: '600' },
  acoes: { marginTop: 4 },
  espaco: { height: 12 },
  versao: { textAlign: 'center', marginTop: 20, fontSize: 12 },
  rodape: { textAlign: 'center', marginTop: 6, fontSize: 10 },
});
