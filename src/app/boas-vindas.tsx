import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Botao from '../components/Botao';
import LogoEstok from '../components/LogoEstok';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

const destaques = [
  {
    icone: 'cube-outline' as const,
    titulo: 'Estoque organizado',
    descricao: 'Cadastre produtos e acompanhe quantidades em um só lugar.',
  },
  {
    icone: 'notifications-outline' as const,
    titulo: 'Alertas úteis',
    descricao: 'Saiba quando algum produto estiver abaixo do mínimo.',
  },
  {
    icone: 'barcode-outline' as const,
    titulo: 'Scanner integrado',
    descricao: 'Encontre produtos rapidamente pelo código de barras.',
  },
];

export default function BoasVindasScreen() {
  const router = useRouter();
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <LogoEstok tamanho="lg" />
        <Text style={[styles.titulo, { color: cores.texto }]}>Bem-vindo ao Estok</Text>
        <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
          Seu estoque mais simples de organizar e acompanhar.
        </Text>

        <View style={styles.destaques}>
          {destaques.map((destaque) => (
            <View
              key={destaque.titulo}
              style={[
                styles.cartao,
                { backgroundColor: cores.card, borderColor: cores.borda },
              ]}
            >
              <View style={[styles.icone, { backgroundColor: cores.superficie }]}>
                <Ionicons name={destaque.icone} size={22} color={cores.primaria} />
              </View>
              <View style={styles.textos}>
                <Text style={[styles.tituloDestaque, { color: cores.texto }]}>
                  {destaque.titulo}
                </Text>
                <Text style={[styles.descricao, { color: cores.textoSecundario }]}>
                  {destaque.descricao}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Botao
          titulo="Começar"
          onPress={() => router.push('/configurar-perfil')}
          icone="arrow-forward"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 24,
    paddingTop: 40,
    gap: 14,
  },
  titulo: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitulo: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  destaques: { gap: 10, marginBottom: 10 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  icone: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 3 },
  tituloDestaque: { fontSize: 15, fontWeight: '700' },
  descricao: { fontSize: 13, lineHeight: 18 },
});
