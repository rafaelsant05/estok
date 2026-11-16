import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Keyboard, Pressable, StyleSheet } from 'react-native';
import Input from './Input';
import LeitorCodigoBarrasModal from './LeitorCodigoBarrasModal';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (codigo: string) => void;
  disabled?: boolean;
};

export default function CampoCodigoBarras({
  label,
  value,
  placeholder,
  onChangeText,
  disabled = false,
}: Props) {
  const [leitorAberto, setLeitorAberto] = useState(false);
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  function abrirLeitor() {
    Keyboard.dismiss();
    setLeitorAberto(true);
  }

  return (
    <>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        editable={!disabled}
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ler código de barras com a câmera"
            disabled={disabled}
            onPress={abrirLeitor}
            style={[
              styles.botaoScanner,
              { borderColor: cores.borda, backgroundColor: cores.card },
              disabled && styles.botaoDesabilitado,
            ]}
          >
            <Ionicons name="barcode-outline" size={23} color={cores.primaria} />
          </Pressable>
        }
      />
      <LeitorCodigoBarrasModal
        visible={leitorAberto}
        onClose={() => setLeitorAberto(false)}
        onCodeRead={onChangeText}
      />
    </>
  );
}

const styles = StyleSheet.create({
  botaoScanner: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
  botaoDesabilitado: { opacity: 0.5 },
});
