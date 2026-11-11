import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { mensagemErroAuth } from '../../services/authErros';
import Botao from '../../components/Botao';
import Input from '../../components/Input';
import Feedback from '../../components/Feedback';
import { cores } from '../../constants/cores';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
      // O redirecionamento para as abas é feito pelo app/_layout.tsx
    } catch (e) {
      setErroGeral(mensagemErroAuth(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.titulo}>Estok</Text>
        <Text style={estilos.subtitulo}>Controle de estoque para o seu negócio</Text>

        <View style={estilos.formulario}>
          <Feedback tipo="erro" mensagem={erroGeral} onFechar={() => setErroGeral(null)} />

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            erro={erros.email}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            erro={erros.senha}
            placeholder="Sua senha"
            secureTextEntry
            autoCapitalize="none"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 36, fontWeight: '800', color: cores.primaria, textAlign: 'center' },
  subtitulo: { fontSize: 15, color: cores.texto, textAlign: 'center', marginBottom: 32 },
  formulario: { width: '100%', maxWidth: 420, alignSelf: 'center' },
});