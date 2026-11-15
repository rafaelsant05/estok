export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo: number;
  codigoBarras?: string;
  fotoUri?: string;
  variantes?: VarianteProduto[];
  criadoEm: number; // timestamp em ms
};

export type VarianteProduto = {
  id: string;
  caracteristica: string;
  quantidade: number;
};

export type TipoMovimentacao = 'entrada' | 'saida';

export type Movimentacao = {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  varianteId?: string;
  varianteNome?: string;
  motivo: string;
  data: number; // timestamp em ms
};

export const MOTIVOS_ENTRADA = ['compra', 'devolucao', 'ajuste'] as const;
export const MOTIVOS_SAIDA = ['venda', 'perda', 'uso_proprio', 'ajuste'] as const;
