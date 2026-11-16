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
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import type { User } from 'firebase/auth';
import Botao from '../../components/Botao';
import Feedback from '../../components/Feedback';
import Input from '../../components/Input';
import { PerfilUsuario, criarPerfilPadrao, useAuthStore } from '../../store/useAuthStore';
import { PALETAS_TEMA, Tema, useThemeStore } from '../../store/useThemeStore';
import { salvarFotoPerfil, salvarPerfilUsuario } from '../../services/perfilService';

const PAPEIS = ['Proprietário(a)', 'Gerente', 'Estoquista', 'Vendedor(a)'] as const;
const OUTRO_PAPEL = 'Outro';
const PERFIL_VAZIO = criarPerfilPadrao();

function formatarCpf(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

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
  const [formulario, setFormulario] = useState<PerfilUsuario>(perfilInicial);
  const erroPerfil = useAuthStore((estado) => estado.erroPerfil);
  const definirPerfil = useAuthStore((estado) => estado.setPerfil);
  const definirErroPerfil = useAuthStore((estado) => estado.setErroPerfil);
  const logout = useAuthStore((estado) => estado.logout);
  const definirTema = useThemeStore((estado) => estado.setTema);
  const tema = useThemeStore((estado) => estado.tema);
  const preferenciaTema = useThemeStore((estado) => estado.preferencia);
  const cores = PALETAS_TEMA[tema];
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [outroPapelSelecionado, setOutroPapelSelecionado] = useState(
    () => !!perfilInicial.role && !PAPEIS.includes(perfilInicial.role as (typeof PAPEIS)[number]),
  );
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
    if (formulario.cpf.replace(/\D/g, '').length !== 11) {
      setFeedback({ tipo: 'erro', mensagem: 'Informe um CPF válido com 11 dígitos.' });
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
      cpf: formatarCpf(formulario.cpf),
      role: formulario.role.trim(),
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

  function confirmarSaida() {
    Alert.alert('Sair da conta', 'Deseja realmente desconectar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void logout().catch(() =>
            Alert.alert('Erro ao sair', 'Não foi possível desconectar. Tente novamente.'),
          );
        },
      },
    ]);
  }

  const papelConhecido = PAPEIS.includes(formulario.role as (typeof PAPEIS)[number]);
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
              label="CPF"
              value={formulario.cpf}
              onChangeText={(valor) => atualizar('cpf', formatarCpf(valor))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
              editable={!salvando}
            />

            <Text style={[styles.rotulo, { color: cores.texto }]}>Papel na empresa</Text>
            <View style={styles.papeis}>
              {[...PAPEIS, OUTRO_PAPEL].map((papel) => {
                const ativo =
                  papel === OUTRO_PAPEL
                    ? outroPapelSelecionado
                    : formulario.role === papel;
                return (
                  <Pressable
                    key={papel}
                    onPress={() => {
                      if (papel === OUTRO_PAPEL) {
                        setOutroPapelSelecionado(true);
                        if (papelConhecido) atualizar('role', '');
                      } else {
                        setOutroPapelSelecionado(false);
                        atualizar('role', papel);
                      }
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: ativo ? cores.primaria : cores.superficie,
                        borderColor: ativo ? cores.primaria : cores.borda,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <Text style={[styles.textoChip, { color: ativo ? cores.textoSobreAcao : cores.texto }]}>
                      {papel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {outroPapelSelecionado && (
              <Input
                label="Outro papel"
                value={formulario.role}
                onChangeText={(valor) => atualizar('role', valor)}
                placeholder="Informe seu papel"
                editable={!salvando}
              />
            )}
            <Input
              label="Nome da loja (opcional)"
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
                ['system', 'Sistema', 'phone-portrait-outline'],
              ] as const).map(([valor, rotulo, icone]) => {
                const ativo = preferenciaTema === valor;
                return (
                  <Pressable
                    key={valor}
                    onPress={() => definirTema(valor as Tema)}
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
              variante="perigo"
              icone="log-out-outline"
            />
          </View>

          <Text style={[styles.versao, { color: cores.textoSecundario }]}>
            Estok • versão {versao}
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
  papeis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  textoChip: { fontSize: 13, fontWeight: '600' },
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
});
