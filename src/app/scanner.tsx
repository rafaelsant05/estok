import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useProdutosStore } from '../store/useProdutosStore';
import { buscarPorCodigoBarras } from '../services/produtosService';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import Botao from '../components/Botao';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Feedback from '../components/Feedback';
import { encontrarProdutoPorCodigo, normalizarCodigoBarras } from '../utils/negocio';

export default function Scanner() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const produtos = useProdutosStore((s) => s.produtos);
  const tema = useThemeStore((s) => s.tema);
  const paleta = PALETAS_TEMA[tema];
  const [permissao, pedirPermissao] = useCameraPermissions();

  const [codigoManual, setCodigoManual] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [travado, setTravado] = useState(false);
  const [focado, setFocado] = useState(false);
  const travaLeitura = useRef(false);

  // Sempre que a tela ganha foco (ex.: voltou do produto), destrava a leitura
  useFocusEffect(
    useCallback(() => {
      setFocado(true);
      travaLeitura.current = false;
      setTravado(false);
      setBuscando(false);
      return () => {
        setFocado(false);
        travaLeitura.current = true;
      };
    }, [])
  );

  // Pergunta se quer cadastrar (Alert no celular, confirm na web)
  function perguntarCadastro(codigo: string) {
    const irParaCadastro = () =>
      router.push({ pathname: '/produto/novo', params: { codigoBarras: codigo } });
    const cancelar = () => {
      travaLeitura.current = false;
      setTravado(false);
    };
    const mensagem = `O código ${codigo} não está cadastrado. Deseja cadastrar um novo produto?`;

    if (Platform.OS === 'web') {
      if (window.confirm(mensagem)) irParaCadastro();
      else cancelar();
    } else {
      Alert.alert('Produto não encontrado', mensagem, [
        { text: 'Não', style: 'cancel', onPress: cancelar },
        { text: 'Cadastrar', onPress: irParaCadastro },
      ]);
    }
  }

  // Lógica única de busca, usada pela câmera e pelo campo manual
  async function processar(codigo: string) {
    const limpo = normalizarCodigoBarras(codigo);
    if (travaLeitura.current || travado || buscando || !user?.uid) return;
    if (!limpo) {
      setErro('Digite um código de barras.');
      return;
    }

    travaLeitura.current = true;
    setTravado(true);
    setErro('');
    setBuscando(true);

    try {
      const produtoLocal = encontrarProdutoPorCodigo(produtos, limpo);
      if (produtoLocal) {
        setBuscando(false);
        router.push({ pathname: '/produto/[id]', params: { id: produtoLocal.id } });
        return;
      }

      const produto = await buscarPorCodigoBarras(user.uid, limpo);
      setBuscando(false);
      if (produto) {
        router.push({ pathname: '/produto/[id]', params: { id: produto.id } });
      } else {
        perguntarCadastro(limpo);
      }
    } catch {
      setBuscando(false);
      travaLeitura.current = false;
      setTravado(false);
      setErro('Não foi possível buscar o produto. Tente novamente.');
    }
  }

  // Permissão ainda sendo verificada
  if (!permissao) return <Loading mensagem="Verificando permissão..." />;

  return (
    <KeyboardAvoidingView
      style={[styles.tela, { backgroundColor: paleta.fundo }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.tela, { backgroundColor: paleta.fundo }]}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {erro ? (
          <Feedback tipo="erro" mensagem={erro} onFechar={() => setErro('')} />
        ) : null}

        {/* Área da câmera */}
        {permissao.granted ? (
          <View style={[styles.cameraBox, { backgroundColor: paleta.fundo }]}>
            {focado ? (
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
                }}
                // Se estiver travado, não recebe leituras
                onBarcodeScanned={travado ? undefined : ({ data }) => processar(data)}
              />
            ) : null}
            {buscando && focado ? <Loading mensagem="Buscando produto..." /> : null}
          </View>
        ) : (
          <View style={[styles.semPermissao, { backgroundColor: paleta.card, borderColor: paleta.borda }]}>
            <Text style={[styles.avisoTitulo, { color: paleta.texto }]}>Câmera sem permissão</Text>
            <Text style={[styles.avisoTexto, { color: paleta.textoSecundario }]}>
              {permissao.canAskAgain
                ? 'Precisamos da câmera para ler o código de barras.'
                : 'A permissão foi negada. Libere o acesso à câmera nas configurações do aparelho ou do navegador.'}
            </Text>
            <Botao titulo="Tentar de novo" onPress={pedirPermissao} />
          </View>
        )}

        {/* Plano B: digitar o código */}
        <Text style={[styles.secao, { color: paleta.texto }]}>Ou digite o código</Text>
        <Input
          label="Código de barras"
          value={codigoManual}
          onChangeText={(texto) => {
            setCodigoManual(texto);
            if (erro) setErro('');
          }}
          keyboardType="numeric"
          placeholder="Ex.: 7891234567890"
        />
        <Botao
          titulo="Buscar"
          onPress={() => processar(codigoManual)}
          carregando={buscando}
          desabilitado={travado || buscando || !user?.uid}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  cameraBox: { height: 300, borderRadius: 12, overflow: 'hidden' },
  camera: { flex: 1 },
  semPermissao: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  avisoTitulo: { fontSize: 16, fontWeight: 'bold' },
  avisoTexto: { fontSize: 14 },
  secao: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
});