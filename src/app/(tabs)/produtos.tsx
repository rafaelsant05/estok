import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// CORREÇÃO 1: Usando chaves para importação nomeada
import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
// CORREÇÃO 2: Importando o tipo Produto para tipar as variáveis
import { Produto } from '../../types';

import CardProduto from '../../components/CardProduto';
import { cores } from '../../constants/cores';
import Loading from '../../components/Loading';
import Feedback from '../../components/Feedback';

export default function ProdutosScreen() {
  const router = useRouter();
  
  // CORREÇÃO 3: Tipagem explícita para o state (any) para evitar o erro TS7006
  const user = useAuthStore((state: any) => state.user);
  const { produtos, carregando, erro, carregar } = useProdutosStore();

  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        carregar(user.uid);
      }
    }, [user?.uid])
  );

  const onRefresh = async () => {
    if (user?.uid) {
      setRefreshing(true);
      await carregar(user.uid);
      setRefreshing(false);
    }
  };

  // CORREÇÃO 4: Avisando ao TypeScript que 'p' é um Produto e o Set guarda strings
  const categorias = useMemo(() => {
    const cats = new Set<string>(produtos.map((p: Produto) => p.categoria));
    return Array.from(cats).sort();
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p: Produto) => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaSelecionada ? p.categoria === categoriaSelecionada : true;
      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaSelecionada]);

  return (
    <View style={styles.container}>
      {erro ? <Feedback tipo="erro" mensagem={erro} /> : null}

      {/* Header com Busca e Filtros */}
      <View style={styles.header}>
        <View style={styles.buscaContainer}>
          <MaterialIcons name="search" size={24} color={cores.texto} style={styles.iconeBusca} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por nome..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor={cores.texto + '80'}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialIcons name="close" size={20} color={cores.texto} />
            </TouchableOpacity>
          )}
        </View>

        {categorias.length > 0 && (
          <View style={styles.filtrosContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, !categoriaSelecionada && styles.chipAtivo]}
                onPress={() => setCategoriaSelecionada('')}
              >
                <Text style={[styles.chipTexto, !categoriaSelecionada && styles.chipTextoAtivo]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, categoriaSelecionada === cat && styles.chipAtivo]}
                  onPress={() => setCategoriaSelecionada(cat)}
                >
                  <Text style={[styles.chipTexto, categoriaSelecionada === cat && styles.chipTextoAtivo]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Lista de Produtos */}
      {carregando && !refreshing && produtos.length === 0 ? (
        <Loading mensagem="Carregando estoque..." />
      ) : (
        <FlatList
          data={produtosFiltrados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cores.primaria]} />
          }
          renderItem={({ item }) => (
            <CardProduto
              produto={item}
              onPress={() => router.push({ pathname: '/produto/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.vazio}>
              <MaterialIcons name="inventory-2" size={48} color={cores.borda} />
              <Text style={styles.vazioTexto}>
                {busca || categoriaSelecionada 
                  ? "Nenhum produto corresponde à busca." 
                  : "Nenhum produto cadastrado ainda."}
              </Text>
            </View>
          )}
        />
      )}

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/produto/novo')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: cores.fundo,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  iconeBusca: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    height: 40,
    color: cores.texto,
  },
  filtrosContainer: {
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  chipAtivo: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  chipTexto: {
    color: cores.texto,
    fontSize: 14,
  },
  chipTextoAtivo: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listaContainer: {
    paddingBottom: 80,
    paddingTop: 8,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  vazioTexto: {
    marginTop: 12,
    fontSize: 16,
    color: cores.texto,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: cores.primaria,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});