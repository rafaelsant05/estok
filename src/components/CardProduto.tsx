import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { cores } from '../constants/cores';
import { Produto } from '../types';

interface Props {
  produto: Produto;
  onPress: () => void;
}

export default function CardProduto({ produto, onPress }: Props) {
  // Regra visual de alerta: quantidade menor ou igual ao estoque mínimo
  const estoqueBaixo = produto.quantidade <= produto.estoqueMinimo;

  return (
    <TouchableOpacity 
      style={[styles.card, estoqueBaixo && styles.cardAlerta]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Miniatura da foto ou Placeholder */}
      {produto.fotoUri ? (
        <Image source={{ uri: produto.fotoUri }} style={styles.imagem} />
      ) : (
        <View style={styles.imagemPlaceholder}>
          <MaterialIcons name="inventory" size={24} color={cores.texto} />
        </View>
      )}

      {/* Informações do Produto */}
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>{produto.nome}</Text>
        <Text style={styles.categoria}>{produto.categoria}</Text>
      </View>

      {/* Quantidade */}
      <View style={styles.quantidadeContainer}>
        <Text style={[styles.quantidade, estoqueBaixo && styles.textoAlerta]}>
          {produto.quantidade}
        </Text>
        <Text style={[styles.unidade, estoqueBaixo && styles.textoAlerta]}>un.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.fundo,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    elevation: 2, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS/Web
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardAlerta: {
    borderColor: cores.aviso,
    backgroundColor: '#FFF8E1', // Fundo levemente amarelado/avermelhado
  },
  imagem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: cores.borda,
  },
  imagemPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
  },
  categoria: {
    fontSize: 12,
    color: cores.texto,
    opacity: 0.7,
    marginTop: 2,
  },
  quantidadeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  quantidade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
  },
  unidade: {
    fontSize: 12,
    color: cores.texto,
    opacity: 0.7,
  },
  textoAlerta: {
    color: cores.erro,
  }
});