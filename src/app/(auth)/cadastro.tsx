import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { mensagemErroAuth } from '../../services/authErros';
import Botao from '../../components/Botao';
import Input from '../../components/Input';
import Feedback from '../../components/Feedback';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Erros = { email?: string; senha?: string; confirmar?: string };

export default function Cadastro() {
  const router = useRouter();
  const tema = useThemeStore((estado) => estado.tema);
  const paleta = PALETAS_TEMA[tema];
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validar() {
    const novos: Erros = {};
    if (!email.trim()) novos.email = 'Informe o e-mail.';
    else if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'E-mail inválido.';
    if (!senha) novos.senha = 'Informe a senha.';
    else if (senha.length < 6) novos.senha = 'A senha deve ter no mínimo 6 caracteres.';
    if (!confirmar) novos.confirmar = 'Confirme a senha.';
    else if (confirmar !== senha) novos.confirmar = 'As senhas não conferem.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function cadastrar() {
    setErroGeral(null);
    if (!validar()) return;

    setCarregando(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), senha);
      // Depois de criar a conta o usuário já fica logado e o app/_layout.tsx redireciona
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
          <Text style={[estilos.titulo, { color: paleta.primaria }]}>Criar conta</Text>
          <Text style={[estilos.subtitulo, { color: paleta.texto }]}>Comece a controlar o seu estoque</Text>

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
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Confirmar senha"
              value={confirmar}
              onChangeText={(valor) => {
                setConfirmar(valor);
                if (erros.confirmar) setErros((atual) => ({ ...atual, confirmar: undefined }));
              }}
              erro={erros.confirmar}
              placeholder="Repita a senha"
              secureTextEntry
              autoCapitalize="none"
            />

            <Botao titulo="Cadastrar" onPress={cadastrar} carregando={carregando} />
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
  conteudo: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  titulo: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  subtitulo: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  formulario: { width: '100%', maxWidth: 420, alignSelf: 'center' },
});