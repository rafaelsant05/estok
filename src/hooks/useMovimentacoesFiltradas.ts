import { useMemo } from 'react';
import { Movimentacao } from '../types';
import { filtrarMovimentacoes } from '../utils/negocio';

type FiltroMovimentacao = 'todas' | 'entrada' | 'saida';

type ProdutoMap = Map<string, any>;

export function useMovimentacoesFiltradas(
  movimentacoes: Movimentacao[],
  filtro: FiltroMovimentacao,
  produtoSelecionadoId: string,
  categoriaSelecionada: string,
  produtoPorId: ProdutoMap,
) {
  return useMemo(
    () =>
      filtrarMovimentacoes(
        movimentacoes,
        {
          tipo: filtro,
          produtoId: produtoSelecionadoId,
          categoria: categoriaSelecionada,
        },
        produtoPorId,
      ),
    [movimentacoes, filtro, produtoSelecionadoId, categoriaSelecionada, produtoPorId],
  );
}
