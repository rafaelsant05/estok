import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Botao from './Botao';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import { normalizarCodigoBarras } from '../utils/negocio';
import { withOpacity } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCodeRead: (codigo: string) => void;
};

const TIPOS_CODIGO_BARRAS = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
] as const;

export default function LeitorCodigoBarrasModal({
  visible,
  onClose,
  onCodeRead,
}: Props) {
  const [permissao, pedirPermissao] = useCameraPermissions();
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const leituraTravada = useRef(true);
  const [erroCamera, setErroCamera] = useState('');

  useEffect(() => {
    leituraTravada.current = !visible;
  }, [visible]);

  const fechar = useCallback(() => {
    leituraTravada.current = true;
    setErroCamera('');
    onClose();
  }, [onClose]);

  const processarLeitura = useCallback(
    (codigoLido: string) => {
      if (leituraTravada.current) return;

      const codigo = normalizarCodigoBarras(codigoLido);
      if (!codigo) return;

      leituraTravada.current = true;
      onCodeRead(codigo);
      fechar();
    },
    [fechar, onCodeRead],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={fechar}
    >
      <SafeAreaView
        style={[
          styles.overlay,
          {
            backgroundColor: withOpacity(
              tema === 'dark' ? cores.fundo : cores.texto,
              tema === 'dark' ? 0.88 : 0.52,
            ),
          },
        ]}
      >
        <View style={[styles.card, { backgroundColor: cores.card }]}>
          <Text style={[styles.titulo, { color: cores.texto }]}>Escanear código de barras</Text>

          <View style={[styles.preview, { backgroundColor: cores.fundo }]}>
            {visible && permissao?.granted && !erroCamera ? (
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: [...TIPOS_CODIGO_BARRAS] }}
                onBarcodeScanned={({ data }) => processarLeitura(data)}
                onMountError={({ message }) => setErroCamera(message)}
              />
            ) : (
              <Text style={[styles.mensagem, { color: cores.texto }]}>
                {erroCamera
                  ? `Não foi possível iniciar a câmera: ${erroCamera}`
                  : !permissao
                  ? 'Verificando permissão da câmera...'
                  : permissao.canAskAgain
                    ? 'Precisamos da câmera para ler o código de barras.'
                    : 'Permissão negada. Libere o acesso à câmera nas configurações do aparelho.'}
              </Text>
            )}
          </View>

          {permissao && !permissao.granted && permissao.canAskAgain ? (
            <Botao
              titulo="Permitir câmera"
              onPress={() => void pedirPermissao()}
            />
          ) : null}
          <Botao titulo="Cancelar" onPress={fechar} variante="secundario" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  titulo: { fontSize: 18, fontWeight: '700' },
  preview: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  camera: { width: '100%', height: '100%' },
  mensagem: {
    paddingHorizontal: 20,
    fontSize: 14,
    textAlign: 'center',
  },
});
