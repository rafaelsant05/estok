import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';
import { Produto } from '../types';

interface Props {
  produto: Produto;
  onPress: () => void;
}

export default function CardProduto({ produto, onPress }: Props) {
  const estoqueBaixo = produto.quantidade <= produto.estoqueMinimo;
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cores.card, borderColor: cores.borda, shadowColor: cores.texto },
        estoqueBaixo && {
          borderColor: cores.aviso,
          backgroundColor: cores.superficie,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {produto.fotoUri ? (
        <Image source={{ uri: produto.fotoUri }} style={styles.imagem} />
      ) : (
        <View style={[styles.imagemPlaceholder, { backgroundColor: cores.superficie }]}>
          <MaterialIcons name="inventory" size={24} color={cores.textoSecundario} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.nome, { color: cores.texto }]} numberOfLines={1}>{produto.nome}</Text>
        <Text style={[styles.categoria, { color: cores.textoSecundario }]}>{produto.categoria}</Text>
        <Text style={[styles.auxiliar, { color: estoqueBaixo ? cores.erro : cores.sucesso }]}>
          {estoqueBaixo ? 'Estoque em alerta' : 'Em dia'}
        </Text>
      </View>

      <View style={styles.quantidadeContainer}>
        <Text style={[styles.quantidade, { color: estoqueBaixo ? cores.erro : cores.texto }]}>{produto.quantidade}</Text>
        <Text style={[styles.unidade, { color: cores.textoSecundario }]}>un.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imagem: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  imagemPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoria: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  auxiliar: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  auxiliarAlerta: {
  },
  quantidadeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 55,
  },
  quantidade: {
    fontSize: 20,
    fontWeight: '800',
  },
  unidade: {
    fontSize: 12,
    opacity: 0.7,
  },
});