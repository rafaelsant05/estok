import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../../constants/cores';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(nome: NomeIcone) {
  return ({ color, size }: { color: unknown; size: number }) => (
    <Ionicons name={nome} color={color as string} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primaria,
        headerTitleAlign: 'center',
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