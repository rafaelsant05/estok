import { useCallback, useRef, useState } from 'react';
import { View, Text, Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { buscarPorCodigoBarras } from '../services/produtosService';
import { cores } from '../constants/cores';
import Botao from '../components/Botao';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Feedback from '../components/Feedback';

export default function Scanner() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [permissao, pedirPermissao] = useCameraPermissions();

  const [codigoManual, setCodigoManual] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');

  // Trava para não processar o mesmo código várias vezes
  const travado = useRef(false);

  // Sempre que a tela ganha foco (ex.: voltou do produto), destrava a leitura
  useFocusEffect(
    useCallback(() => {
      travado.current = false;
      setBuscando(false);
    }, [])
  );

  // Pergunta se quer cadastrar (Alert no celular, confirm na web)
  function perguntarCadastro(codigo: string) {
    const irParaCadastro = () =>
      router.push({ pathname: '/produto/novo', params: { codigoBarras: codigo } });
    const cancelar = () => {
      travado.current = false; // libera nova leitura
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
    const limpo = codigo.trim();
    if (travado.current || !user?.uid) return;
    if (!limpo) {
      setErro('Digite um código de barras.');
      return;
    }

    travado.current = true;
    setErro('');
    setBuscando(true);

    try {
      const produto = await buscarPorCodigoBarras(user.uid, limpo);
      setBuscando(false);
      if (produto) {
        router.push({ pathname: '/produto/[id]', params: { id: produto.id } });
      } else {
        perguntarCadastro(limpo);
      }
    } catch (e) {
      setBuscando(false);
      travado.current = false;
      setErro('Não foi possível buscar o produto. Tente novamente.');
    }
  }

  // Permissão ainda sendo verificada
  if (!permissao) return <Loading mensagem="Verificando permissão..." />;

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      {erro ? (
        <Feedback tipo="erro" mensagem={erro} onFechar={() => setErro('')} />
      ) : null}

      {/* Área da câmera */}
      {permissao.granted ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            // Se estiver travado, não recebe leituras
            onBarcodeScanned={travado.current ? undefined : ({ data }) => processar(data)}
          />
          {buscando ? <Loading mensagem="Buscando produto..." /> : null}
        </View>
      ) : (
        <View style={styles.semPermissao}>
          <Text style={styles.avisoTitulo}>Câmera sem permissão</Text>
          <Text style={styles.avisoTexto}>
            {permissao.canAskAgain
              ? 'Precisamos da câmera para ler o código de barras.'
              : 'A permissão foi negada. Libere o acesso à câmera nas configurações do aparelho ou do navegador.'}
          </Text>
          <Botao titulo="Tentar de novo" onPress={pedirPermissao} />
        </View>
      )}

      {/* Plano B: digitar o código */}
      <Text style={styles.secao}>Ou digite o código</Text>
      <Input
        label="Código de barras"
        value={codigoManual}
        onChangeText={setCodigoManual}
        keyboardType="numeric"
        placeholder="Ex.: 7891234567890"
      />
      <Botao
        titulo="Buscar"
        onPress={() => processar(codigoManual)}
        carregando={buscando}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 12 },
  cameraBox: { height: 300, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  semPermissao: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  avisoTitulo: { fontSize: 16, fontWeight: 'bold', color: cores.texto },
  avisoTexto: { fontSize: 14, color: cores.texto },
  secao: { fontSize: 16, fontWeight: 'bold', color: cores.texto, marginTop: 8 },
});