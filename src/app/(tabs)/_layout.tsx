import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../../constants/cores';
import { useAuthStore } from '../../store/useAuthStore';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(nome: NomeIcone) {
  return ({ color, size }: { color: unknown; size: number }) => (
    <Ionicons name={nome} color={color as string} size={size} />
  );
}

export default function TabsLayout() {
  const logout = useAuthStore((estado) => estado.logout);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primaria,
        headerTitleAlign: 'center',
        headerRight: () => (
          <Pressable onPress={logout} style={{ marginRight: 16 }} accessibilityLabel="Sair">
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
    </Tabs>
  );
}