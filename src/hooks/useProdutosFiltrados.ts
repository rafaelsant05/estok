import { useMemo } from 'react';
import { Produto } from '../types';
import { filtrarProdutos } from '../utils/negocio';

export function useProdutosFiltrados(produtos: Produto[], busca: string, categoriaSelecionada: string) {
  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((produto) => produto.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [produtos],
  );

  const produtosFiltrados = useMemo(
    () => filtrarProdutos(produtos, { busca, categoria: categoriaSelecionada }),
    [produtos, busca, categoriaSelecionada],
  );

  return {
    categorias,
    produtosFiltrados,
  };
}
