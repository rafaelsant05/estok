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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';
import { mensagemErroAuth } from '../../services/authErros';
import Botao from '../../components/Botao';
import Input from '../../components/Input';
import Feedback from '../../components/Feedback';
import LogoEstok from '../../components/LogoEstok';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const tema = useThemeStore((estado) => estado.tema);
  const paleta = PALETAS_TEMA[tema];
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validar() {
    const novos: { email?: string; senha?: string } = {};
    if (!email.trim()) novos.email = 'Informe o e-mail.';
    else if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'E-mail inválido.';
    if (!senha) novos.senha = 'Informe a senha.';
    else if (senha.length < 6) novos.senha = 'A senha deve ter no mínimo 6 caracteres.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function entrar() {
    setErroGeral(null);
    if (!validar()) return;

    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // O layout carrega o perfil e direciona novos usuários pelo onboarding.
    } catch (e) {
      setErroGeral(mensagemErroAuth(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[estilos.tela, { backgroundColor: paleta.fundo }]}>
      <KeyboardAvoidingView
        style={estilos.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <LogoEstok tamanho="lg" />
          <Text style={[estilos.subtitulo, { color: paleta.texto }]}>Controle de estoque para o seu negócio</Text>

          <View style={estilos.formulario}>
            <Feedback tipo="erro" mensagem={erroGeral} onFechar={() => setErroGeral(null)} />

            <Input
              label="E-mail"
              value={email}
              onChangeText={(valor) => {
                setEmail(valor);
                if (erros.email) setErros((atual) => ({ ...atual, email: undefined }));
              }}
              erro={erros.email}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Senha"
              value={senha}
              onChangeText={(valor) => {
                setSenha(valor);
                if (erros.senha) setErros((atual) => ({ ...atual, senha: undefined }));
              }}
              erro={erros.senha}
              placeholder="Sua senha"
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              rightActionInside
              rightAction={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setMostrarSenha((mostrar) => !mostrar)}
                  style={estilos.acaoSenha}
                >
                  <Ionicons
                    name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={paleta.icone}
                  />
                </Pressable>
              }
            />

            <Botao titulo="Entrar" onPress={entrar} carregando={carregando} />
            <View style={{ height: 12 }} />
            <Botao
              titulo="Criar conta"
              variante="secundario"
              onPress={() => router.push('/(auth)/cadastro')}
              desabilitado={carregando}
            />
          </View>
          <Text style={[estilos.rodape, { color: paleta.textoSecundario }]}>
            © 2026 Estok • Desenvolvido por Rafael Carvalho, Rickson Figueiredo, Jonathan Marinho e Bruno França
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  teclado: { flex: 1 },
  conteudo: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  subtitulo: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  formulario: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  acaoSenha: { width: 44, height: 46, alignItems: 'center', justifyContent: 'center' },
  rodape: { textAlign: 'center', marginTop: 28, fontSize: 10 },
});