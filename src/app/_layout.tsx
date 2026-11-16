import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { carregarPerfilUsuario } from '../services/perfilService';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

export default function RootLayout() {
  const { user, carregando, setUser, setPerfil, setErroPerfil } = useAuthStore();
  const tema = useThemeStore((estado) => estado.tema);
  const setTemaSistema = useThemeStore((estado) => estado.setTemaSistema);
  const cores = PALETAS_TEMA[tema];
  const esquemaSistema = useColorScheme() ?? 'light';
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setTemaSistema(esquemaSistema);
  }, [esquemaSistema, setTemaSistema]);

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
      ).then(({ perfil, erro }) => {
        setPerfil(usuario.uid, perfil);
        if (erro && useAuthStore.getState().user?.uid === usuario.uid) {
          setErroPerfil('Não foi possível sincronizar o perfil. Os dados locais continuam disponíveis.');
        }
      });
    });
    return cancelar;
  }, [setErroPerfil, setPerfil, setUser]);

  // Redireciona conforme o usuário esteja logado ou não
  useEffect(() => {
    if (carregando) return;
    const naAreaDeLogin = segments[0] === '(auth)';

    if (!user && !naAreaDeLogin) {
      router.replace('/(auth)/login');
    } else if (user && naAreaDeLogin) {
      router.replace('/(tabs)');
    }
  }, [user, carregando, router, segments]);

  return (
    <>
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
        <Stack.Screen name="produto/novo" options={{ headerShown: true, title: 'Novo produto' }} />
        <Stack.Screen name="produto/[id]" options={{ headerShown: true, title: 'Produto' }} />
        <Stack.Screen name="scanner" options={{ headerShown: true, title: 'Scanner' }} />
      </Stack>

      {carregando && (
        <View style={[estilos.carregando, { backgroundColor: cores.fundo }]}>
          <ActivityIndicator size="large" color={cores.primaria} />
        </View>
      )}
    </>
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