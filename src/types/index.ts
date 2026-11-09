export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo: number;
  codigoBarras?: string;
  fotoUri?: string;
  criadoEm: number; // timestamp em ms
};

export type TipoMovimentacao = 'entrada' | 'saida';

export type Movimentacao = {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string;
  data: number; // timestamp em ms
};

export const MOTIVOS_ENTRADA = ['compra', 'devolucao', 'ajuste'] as const;
export const MOTIVOS_SAIDA = ['venda', 'perda', 'uso_proprio', 'ajuste'] as const;
