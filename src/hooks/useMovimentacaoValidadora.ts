import { useMemo } from 'react';
import { Produto } from '../types';
import { validarMovimentacao } from '../utils/negocio';

type DadosValidacao = {
  produtoId: string | null;
  produtoSelecionado: Produto | undefined;
  varianteId: string;
  quantidade: string;
  motivo: string;
  tipo: 'entrada' | 'saida';
};

export function useMovimentacaoValidadora(dados: DadosValidacao) {
  return useMemo(
    () =>
      validarMovimentacao({
        produtoId: dados.produtoId,
        produtoSelecionado: dados.produtoSelecionado,
        varianteId: dados.varianteId,
        quantidade: dados.quantidade,
        motivo: dados.motivo,
        tipo: dados.tipo,
      }),
    [dados],
  );
}
