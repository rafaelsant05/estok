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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { mensagemErroAuth } from '../../services/authErros';
import { criarPerfilPadrao, PerfilUsuario, useAuthStore } from '../../store/useAuthStore';
import Botao from '../../components/Botao';
import Input from '../../components/Input';
import Feedback from '../../components/Feedback';
import LogoEstok from '../../components/LogoEstok';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUISITOS_SENHA = [
  { rotulo: 'Pelo menos 8 caracteres', validar: (senha: string) => senha.length >= 8 },
  { rotulo: 'Uma letra maiúscula (A–Z)', validar: (senha: string) => /[A-Z]/.test(senha) },
  { rotulo: 'Um número (0–9)', validar: (senha: string) => /[0-9]/.test(senha) },
  {
    rotulo: 'Um caractere especial',
    validar: (senha: string) => /[^A-Za-z0-9]/.test(senha),
  },
] as const;

type Erros = { nome?: string; email?: string; senha?: string; confirmar?: string };

export default function Cadastro() {
  const router = useRouter();
  const tema = useThemeStore((estado) => estado.tema);
  const paleta = PALETAS_TEMA[tema];
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const requisitosSenha = REQUISITOS_SENHA.map((requisito) => ({
    ...requisito,
    atendido: requisito.validar(senha),
  }));
  const senhaForte = requisitosSenha.every((requisito) => requisito.atendido);

  function validar() {
    const novos: Erros = {};
    if (!nome.trim()) novos.nome = 'Informe seu nome.';
    if (!email.trim()) novos.email = 'Informe o e-mail.';
    else if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'E-mail inválido.';
    if (!senha) novos.senha = 'Informe a senha.';
    else if (!senhaForte) novos.senha = 'A senha ainda não atende a todos os requisitos.';
    if (!confirmar) novos.confirmar = 'Confirme a senha.';
    else if (confirmar !== senha) novos.confirmar = 'As senhas não conferem.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function cadastrar() {
    setErroGeral(null);
    if (!validar()) return;

    setCarregando(true);
    let contaCriada = false;
    try {
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      contaCriada = true;
      await setDoc(doc(db, 'users', credencial.user.uid), {
        nome: nome.trim(),
        email: credencial.user.email ?? email.trim(),
        criadoEm: serverTimestamp(),
        onboardingConcluido: false,
      });
      const perfil: PerfilUsuario = {
        ...criarPerfilPadrao(credencial.user),
        displayName: nome.trim(),
        onboardingConcluido: false,
      };
      const store = useAuthStore.getState();
      store.setUser(credencial.user);
      store.setPerfil(credencial.user.uid, perfil);
      router.replace('/boas-vindas');
    } catch (e) {
      setErroGeral(
        contaCriada
          ? 'A conta foi criada, mas não foi possível salvar seus dados iniciais. Tente entrar novamente.'
          : mensagemErroAuth(e),
      );
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
          <LogoEstok tamanho="md" />
          <Text style={[estilos.titulo, { color: paleta.primaria }]}>Criar conta</Text>
          <Text style={[estilos.subtitulo, { color: paleta.texto }]}>Comece a controlar o seu estoque</Text>

          <View style={estilos.formulario}>
            <Feedback tipo="erro" mensagem={erroGeral} onFechar={() => setErroGeral(null)} />

            <Input
              label="Nome"
              value={nome}
              onChangeText={(valor) => {
                setNome(valor);
                if (erros.nome) setErros((atual) => ({ ...atual, nome: undefined }));
              }}
              erro={erros.nome}
              placeholder="Seu nome"
              autoCapitalize="words"
              autoCorrect={false}
            />
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
              placeholder="Crie uma senha forte"
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
            <View style={estilos.checklist}>
              {requisitosSenha.map((requisito) => (
                <View key={requisito.rotulo} style={estilos.requisito}>
                  <Ionicons
                    name={requisito.atendido ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={requisito.atendido ? paleta.sucesso : paleta.textoSecundario}
                  />
                  <Text
                    style={[
                      estilos.textoRequisito,
                      { color: requisito.atendido ? paleta.sucesso : paleta.textoSecundario },
                    ]}
                  >
                    {requisito.rotulo}
                  </Text>
                </View>
              ))}
            </View>
            <Input
              label="Confirmar senha"
              value={confirmar}
              onChangeText={(valor) => {
                setConfirmar(valor);
                if (erros.confirmar) setErros((atual) => ({ ...atual, confirmar: undefined }));
              }}
              erro={erros.confirmar}
              placeholder="Repita a senha"
              secureTextEntry={!mostrarConfirmacao}
              autoCapitalize="none"
              rightActionInside
              rightAction={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={mostrarConfirmacao ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setMostrarConfirmacao((mostrar) => !mostrar)}
                  style={estilos.acaoSenha}
                >
                  <Ionicons
                    name={mostrarConfirmacao ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={paleta.icone}
                  />
                </Pressable>
              }
            />

            <Botao
              titulo="Cadastrar"
              onPress={cadastrar}
              carregando={carregando}
              desabilitado={!senhaForte}
            />
            <View style={{ height: 12 }} />
            <Botao
              titulo="Já tenho conta"
              variante="secundario"
              onPress={() => router.replace('/(auth)/login')}
              desabilitado={carregando}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  teclado: { flex: 1 },
  conteudo: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  titulo: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  subtitulo: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  formulario: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  checklist: { marginTop: -4, marginBottom: 14, gap: 6 },
  requisito: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoRequisito: { fontSize: 13 },
  acaoSenha: { width: 44, height: 46, alignItems: 'center', justifyContent: 'center' },
});