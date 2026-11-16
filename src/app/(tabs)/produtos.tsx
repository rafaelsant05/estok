import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/useAuthStore';
import { useProdutosStore } from '../../store/useProdutosStore';
import { useProdutosFiltrados } from '../../hooks/useProdutosFiltrados';

import CardProduto from '../../components/CardProduto';
import { PALETAS_TEMA, useThemeStore } from '../../store/useThemeStore';
import Loading from '../../components/Loading';
import Feedback from '../../components/Feedback';

export default function ProdutosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ estoqueBaixo?: string }>();
  
  // CORREÇÃO 3: Tipagem explícita para o state (any) para evitar o erro TS7006
  const user = useAuthStore((state: any) => state.user);
  const tema = useThemeStore((state) => state.tema);
  const paleta = PALETAS_TEMA[tema];
  const { produtos, carregando, erro, carregar } = useProdutosStore();

  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const somenteEstoqueBaixo = params.estoqueBaixo === '1';
  const [refreshing, setRefreshing] = useState(false);
  const userUid = user?.uid;

  useFocusEffect(
    useCallback(() => {
      if (userUid) {
        carregar(userUid);
      }
    }, [carregar, userUid])
  );

  const onRefresh = async () => {
    if (user?.uid) {
      setRefreshing(true);
      await carregar(user.uid);
      setRefreshing(false);
    }
  };

  const produtosParaFiltrar = somenteEstoqueBaixo
    ? produtos.filter((produto) => produto.quantidade <= produto.estoqueMinimo)
    : produtos;
  const { categorias, produtosFiltrados } = useProdutosFiltrados(
    produtosParaFiltrar,
    busca,
    categoriaSelecionada,
  );

  return (
    <View style={[styles.container, { backgroundColor: paleta.fundo }]}>
      {erro ? <Feedback tipo="erro" mensagem={erro} /> : null}

      {/* Header com Busca e Filtros */}
      <View style={[styles.header, { backgroundColor: paleta.card, borderBottomColor: paleta.borda }]}>
        <View style={[styles.buscaContainer, { backgroundColor: paleta.superficie, borderColor: paleta.borda }]}>
          <MaterialIcons name="search" size={22} color={paleta.primaria} style={styles.iconeBusca} />
          <TextInput
            style={[styles.buscaInput, { color: paleta.texto }]}
            placeholder="Buscar por nome..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor={paleta.desabilitado}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialIcons name="close" size={20} color={paleta.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>

        {categorias.length > 0 && (
          <View style={styles.filtrosContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  { backgroundColor: !categoriaSelecionada ? paleta.primaria : paleta.superficie, borderColor: !categoriaSelecionada ? paleta.primaria : paleta.borda },
                ]}
                onPress={() => setCategoriaSelecionada('')}
              >
                <Text style={[styles.chipTexto, { color: !categoriaSelecionada ? paleta.textoSobreAcao : paleta.texto }]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    { backgroundColor: categoriaSelecionada === cat ? paleta.primaria : paleta.superficie, borderColor: categoriaSelecionada === cat ? paleta.primaria : paleta.borda },
                  ]}
                  onPress={() => setCategoriaSelecionada(cat)}
                >
                  <Text style={[styles.chipTexto, { color: categoriaSelecionada === cat ? paleta.textoSobreAcao : paleta.texto }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {somenteEstoqueBaixo && (
          <Pressable
            style={[styles.filtroEstoqueBaixo, { backgroundColor: paleta.superficie, borderColor: paleta.aviso }]}
            onPress={() => router.replace('/(tabs)/produtos')}
            accessibilityRole="button"
            accessibilityLabel="Remover filtro de estoque baixo"
          >
            <MaterialIcons name="warning-amber" size={16} color={paleta.aviso} />
            <Text style={[styles.filtroEstoqueBaixoTexto, { color: paleta.texto }]}>
              Estoque baixo
            </Text>
            <MaterialIcons name="close" size={16} color={paleta.textoSecundario} />
          </Pressable>
        )}
      </View>

      {/* Lista de Produtos */}
      {carregando && !refreshing && produtos.length === 0 ? (
        <Loading mensagem="Carregando estoque..." />
      ) : (
        <FlatList
          data={produtosFiltrados}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listaContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[paleta.primaria]} />
          }
          renderItem={({ item }) => (
            <CardProduto
              produto={item}
              onPress={() => router.push({ pathname: '/produto/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.vazio}>
              <MaterialIcons name="inventory-2" size={48} color={paleta.borda} />
              <Text style={[styles.vazioTexto, { color: paleta.textoSecundario }]}>
                {busca || categoriaSelecionada 
                  ? "Nenhum produto corresponde à busca." 
                  : somenteEstoqueBaixo
                    ? "Nenhum produto com estoque baixo."
                    : "Nenhum produto cadastrado ainda."}
              </Text>
            </View>
          )}
        />
      )}

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: paleta.primaria, shadowColor: paleta.texto }]}
        onPress={() => router.push('/produto/novo')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color={paleta.textoSobreAcao} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  iconeBusca: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  filtrosContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  filtroEstoqueBaixo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  filtroEstoqueBaixoTexto: { fontSize: 12, fontWeight: '700' },
  listaContainer: {
    flexGrow: 1,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  }
});