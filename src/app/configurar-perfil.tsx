import { useState } from 'react';
import {
  ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import Botao from '../components/Botao';
import Feedback from '../components/Feedback';
import Input from '../components/Input';
import { salvarFotoPerfil, salvarPerfilUsuario } from '../services/perfilService';
import { PerfilUsuario, useAuthStore } from '../store/useAuthStore';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

export default function ConfigurarPerfilScreen() {
  const user = useAuthStore((estado) => estado.user);
  const carregandoPerfil = useAuthStore((estado) => estado.carregandoPerfil);
  const perfil = useAuthStore((estado) =>
    estado.perfilUid === estado.user?.uid ? estado.perfil : null,
  );
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  if (carregandoPerfil || !perfil) {
    return (
      <SafeAreaView
        style={[styles.tela, styles.carregandoTela, { backgroundColor: cores.fundo }]}
        edges={['left', 'right']}
      >
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={[styles.textoCarregando, { color: cores.textoSecundario }]}>
          Carregando seu perfil...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <FormularioConfigurarPerfil
      key={user?.uid ?? 'sem-usuario'}
      user={user}
      perfilInicial={perfil}
    />
  );
}

type FotoSelecionada = {
  uri: string;
  base64: string | null | undefined;
  mimeType: string | null | undefined;
};

function FormularioConfigurarPerfil({
  user,
  perfilInicial,
}: {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  perfilInicial: PerfilUsuario;
}) {
  const router = useRouter();
  const definirPerfil = useAuthStore((estado) => estado.setPerfil);
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const [nome, setNome] = useState(perfilInicial.displayName);
  const [fotoSelecionada, setFotoSelecionada] = useState<FotoSelecionada | null>(null);
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro' | 'aviso';
    mensagem: string;
  } | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function escolherFoto() {
    if (!user || carregandoFoto || salvando) return;

    setCarregandoFoto(true);
    try {
      setFeedback(null);
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        setFeedback({
          tipo: 'aviso',
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
      setFotoSelecionada({
        uri: foto.uri,
        base64: foto.base64,
        mimeType: foto.mimeType,
      });
      setFeedback(null);
    } catch {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível escolher a foto. Tente novamente.',
      });
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function concluir(incluirFoto: boolean) {
    if (!user || salvando) return;
    const nomeSalvo = nome.trim();
    if (!nomeSalvo) {
      setErroNome('Informe como gostaria de ser chamado.');
      return;
    }
    setErroNome(undefined);
    setFeedback(null);
    setSalvando(true);

    try {
      let photoUrl = perfilInicial.photoUrl;
      if (incluirFoto && fotoSelecionada) {
        const envio = await salvarFotoPerfil(
          user.uid,
          fotoSelecionada.uri,
          fotoSelecionada.base64,
          fotoSelecionada.mimeType,
        );
        photoUrl = envio.photoUrl;
      }

      const perfilAtualizado: PerfilUsuario = {
        ...perfilInicial,
        displayName: nomeSalvo,
        photoUrl,
        onboardingConcluido: true,
      };
      await salvarPerfilUsuario(user.uid, perfilAtualizado, true);
      definirPerfil(user.uid, perfilAtualizado);
      router.replace('/(tabs)');
    } catch {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível salvar seu perfil. Verifique a conexão e tente novamente.',
      });
    } finally {
      setSalvando(false);
    }
  }

  const inicial = nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
  const fotoExibida = fotoSelecionada?.uri ?? perfilInicial.photoUrl;

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cabecalhoIcone, { backgroundColor: cores.superficie }]}>
            <Ionicons name="person-outline" size={28} color={cores.primaria} />
          </View>
          <Text style={[styles.titulo, { color: cores.texto }]}>Vamos configurar seu perfil</Text>
          <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
            Escolha como gostaria de aparecer no Estok.
          </Text>

          {feedback && <Feedback tipo={feedback.tipo} mensagem={feedback.mensagem} />}

          <Pressable
            style={[
              styles.avatar,
              { backgroundColor: cores.superficie, borderColor: cores.borda },
            ]}
            onPress={() => void escolherFoto()}
            disabled={carregandoFoto || salvando}
            accessibilityRole="button"
            accessibilityLabel="Escolher foto de perfil"
          >
            {fotoExibida ? (
              <Image source={{ uri: fotoExibida }} style={styles.foto} />
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
                <Ionicons name="camera-outline" size={17} color={cores.textoSobreAcao} />
              )}
            </View>
          </Pressable>
          <Text style={[styles.ajudaFoto, { color: cores.textoSecundario }]}>
            A foto é opcional e pode ser adicionada ou alterada depois em Configurações.
          </Text>

          <Input
            label="Como você gostaria de ser chamado?"
            value={nome}
            onChangeText={(valor) => {
              setNome(valor);
              if (erroNome) setErroNome(undefined);
            }}
            erro={erroNome}
            placeholder="Seu nome"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!salvando}
          />

          <View style={styles.acoes}>
            <Botao
              titulo="Concluir e entrar"
              onPress={() => void concluir(true)}
              carregando={salvando}
              desabilitado={carregandoFoto || !user}
              icone="checkmark"
            />
            <Botao
              titulo="Pular foto por enquanto"
              onPress={() => void concluir(false)}
              variante="secundario"
              desabilitado={salvando || carregandoFoto || !user}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  teclado: { flex: 1 },
  carregandoTela: { alignItems: 'center', justifyContent: 'center' },
  textoCarregando: { marginTop: 10, fontSize: 14 },
  conteudo: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  cabecalhoIcone: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titulo: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitulo: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, marginBottom: 22 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  foto: { width: '100%', height: '100%', borderRadius: 52 },
  inicial: { fontSize: 40, fontWeight: '800' },
  iconeFoto: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  ajudaFoto: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  acoes: { gap: 10, marginTop: 6 },
});
