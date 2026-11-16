import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { carregarPerfilUsuario } from '../services/perfilService';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import AvisoPrivacidade from '../components/AvisoPrivacidade';

export default function RootLayout() {
  const {
    user,
    perfil,
    perfilUid,
    carregando,
    carregandoPerfil,
    setUser,
    setPerfil,
    setErroPerfil,
  } = useAuthStore();
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const segments = useSegments();
  const router = useRouter();

  // Escuta o login e o logout do Firebase
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      if (!usuario) return;

      setErroPerfil(null);
      void carregarPerfilUsuario(
        usuario.uid,
        usuario.displayName,
        usuario.photoURL,
      ).then(({ perfil: perfilCarregado, erro }) => {
        setPerfil(usuario.uid, perfilCarregado);
        if (erro) {
          console.warn('Não foi possível sincronizar o perfil da conta.', erro);
        }
        if (erro && useAuthStore.getState().user?.uid === usuario.uid) {
          setErroPerfil('Não foi possível sincronizar o perfil. Os dados locais continuam disponíveis.');
        }
      }).catch((erro: unknown) => {
        console.warn('Não foi possível carregar a conta.', erro);
        setPerfil(usuario.uid, {
          displayName: usuario.displayName ?? '',
          photoUrl: usuario.photoURL,
          storeName: '',
          defaultMinStock: null,
        });
      });
    });
    return cancelar;
  }, [setErroPerfil, setPerfil, setUser]);

  // Direciona novos usuários pelo onboarding, sem bloquear contas antigas.
  useEffect(() => {
    if (carregando || (user && carregandoPerfil)) return;
    const naAreaDeLogin = segments[0] === '(auth)';
    const naPaginaLgpd = segments[0] === 'lgpd';
    const naAreaOnboarding =
      segments[0] === 'boas-vindas' || segments[0] === 'configurar-perfil';
    const onboardingConcluido =
      perfilUid === user?.uid ? perfil.onboardingConcluido : undefined;

    if (!user && !naAreaDeLogin) {
      if (!naPaginaLgpd) router.replace('/(auth)/login');
    } else if (user && naPaginaLgpd) {
      return;
    } else if (user && onboardingConcluido === false && !naAreaOnboarding) {
      router.replace('/boas-vindas');
    } else if (user && onboardingConcluido !== false && (naAreaOnboarding || naAreaDeLogin)) {
      router.replace('/(tabs)');
    }
  }, [
    user,
    perfil,
    perfilUid,
    carregando,
    carregandoPerfil,
    router,
    segments,
  ]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={tema === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Voltar',
          headerTransparent: false,
          headerStyle: { backgroundColor: cores.card },
          headerTintColor: cores.texto,
          headerTitleStyle: { color: cores.texto },
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen name="lgpd" options={{ headerShown: false }} />
        <Stack.Screen name="boas-vindas" options={{ headerShown: false }} />
        <Stack.Screen name="configurar-perfil" options={{ headerShown: false }} />
        <Stack.Screen name="produto/novo" options={{ headerShown: true, title: 'Novo produto' }} />
        <Stack.Screen name="produto/[id]" options={{ headerShown: true, title: 'Produto' }} />
        <Stack.Screen name="scanner" options={{ headerShown: true, title: 'Scanner' }} />
      </Stack>

      {(carregando || (!!user && carregandoPerfil)) && (
        <View style={[estilos.carregando, { backgroundColor: cores.fundo }]}>
          <ActivityIndicator size="large" color={cores.primaria} />
        </View>
      )}
      <AvisoPrivacidade />
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  carregando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});