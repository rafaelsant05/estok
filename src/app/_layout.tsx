import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { cores } from '../constants/cores';

export default function RootLayout() {
  const { user, carregando, setUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Escuta o login e o logout do Firebase
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (usuario) => setUser(usuario));
    return cancelar;
  }, []);

  // Redireciona conforme o usuário esteja logado ou não
  useEffect(() => {
    if (carregando) return;
    const naAreaDeLogin = segments[0] === '(auth)';

    if (!user && !naAreaDeLogin) {
      router.replace('/(auth)/login');
    } else if (user && naAreaDeLogin) {
      router.replace('/(tabs)');
    }
  }, [user, carregando, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="produto/novo" options={{ headerShown: true, title: 'Novo produto' }} />
        <Stack.Screen name="produto/[id]" options={{ headerShown: true, title: 'Produto' }} />
        <Stack.Screen name="scanner" options={{ headerShown: true, title: 'Scanner' }} />
      </Stack>

      {carregando && (
        <View style={estilos.carregando}>
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
    backgroundColor: cores.fundo,
  },
});