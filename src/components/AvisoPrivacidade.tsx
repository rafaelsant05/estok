import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

export default function AvisoPrivacidade() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => setVisivel(false), 8000);
    return () => clearTimeout(temporizador);
  }, []);

  if (!visivel) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        style={[
          styles.aviso,
          {
            bottom: Math.max(insets.bottom, 8) + 12,
            backgroundColor: cores.card,
            borderColor: cores.borda,
            shadowColor: cores.texto,
          },
        ]}
      >
        <View style={styles.conteudo}>
          <Ionicons name="shield-checkmark-outline" size={20} color={cores.primaria} />
          <Text style={[styles.texto, { color: cores.texto }]}>
            Ao usar o Estok, seus dados são tratados conforme a LGPD e este aviso de privacidade.
          </Text>
          <Pressable
            onPress={() => setVisivel(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso de privacidade"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={cores.textoSecundario} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            setVisivel(false);
            router.push('/lgpd');
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.acao, pressed && styles.pressionado]}
        >
          <Text style={[styles.textoAcao, { color: cores.primaria }]}>Ler LGPD</Text>
          <Ionicons name="arrow-forward" size={16} color={cores.primaria} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  aviso: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignSelf: 'center',
    maxWidth: 480,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  conteudo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  texto: { flex: 1, fontSize: 13, lineHeight: 18 },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingTop: 10,
  },
  textoAcao: { fontSize: 14, fontWeight: '700' },
  pressionado: { opacity: 0.7 },
});
