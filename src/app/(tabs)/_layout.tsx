import type { ComponentProps } from 'react';
import { Alert, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(nome: NomeIcone) {
  return function IconeTab({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={nome} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  const logout = useAuthStore((estado) => estado.logout);
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: cores.card,
          borderTopColor: cores.borda,
        },
        headerStyle: { backgroundColor: cores.card },
        headerTintColor: cores.texto,
        headerTitleStyle: { color: cores.texto },
        headerTitleAlign: 'center',
        headerRight: () => (
          <Pressable
            onPress={() =>
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
              ])
            }
            style={{ marginRight: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Sair"
          >
            <Ionicons name="log-out-outline" size={24} color={cores.primaria} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: icone('home-outline') }}
      />
      <Tabs.Screen
        name="produtos"
        options={{ title: 'Produtos', tabBarIcon: icone('cube-outline') }}
      />
      <Tabs.Screen
        name="movimentacoes"
        options={{ title: 'Movimentações', tabBarIcon: icone('swap-vertical-outline') }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{ title: 'Configurações', tabBarIcon: icone('settings-outline') }}
      />
    </Tabs>
  );
}