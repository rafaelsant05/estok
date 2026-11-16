/** @param {string} [texto=''] */
export function normalizarBusca(texto = '') {
  return texto.trim().toLocaleLowerCase('pt-BR');
}

/** @param {string | number} [codigo=''] */
export function normalizarCodigoBarras(codigo = '') {
  return String(codigo).trim();
}

export function normalizarTextoProduto(texto = '') {
  return String(texto).trim();
}

/**
 * @param {any[]} produtos
 * @param {{ busca?: string, categoria?: string }} [filtros]
 * @returns {any[]}
 */
export function filtrarProdutos(produtos, { busca = '', categoria = '' } = {}) {
  const termo = normalizarBusca(busca);
  const categoriaSelecionada = categoria?.trim() ?? '';

  return produtos.filter((produto) => {
    const nome = produto?.nome ?? '';
    const categoriaProduto = produto?.categoria ?? '';
    const bateBusca = !termo || normalizarBusca(nome).includes(termo);
    const bateCategoria = !categoriaSelecionada || categoriaProduto === categoriaSelecionada;
    return bateBusca && bateCategoria;
  });
}

/**
 * @param {any[]} produtos
 * @param {string} [busca='']
 * @param {string} [categoria='']
 * @returns {any[]}
 */
export function sugerirProdutosPorNome(produtos, busca = '', categoria = '') {
  return filtrarProdutos(produtos, { busca, categoria }).slice(0, 6);
}

/**
 * @param {any[]} [movimentacoes=[]]
 * @param {{ tipo?: 'todas' | 'entrada' | 'saida', produtoId?: string, categoria?: string }} [filtros={}] 
 * @param {Map<string, any>} [produtoPorId=new Map()]
 * @returns {any[]}
 */
export function filtrarMovimentacoes(
  movimentacoes = [],
  filtros = {},
  produtoPorId = new Map(),
) {
  const { tipo = 'todas', produtoId = '', categoria = '' } = filtros;
  const categoriaSelecionada = String(categoria ?? '').trim();
  const produtoSelecionadoId = String(produtoId ?? '').trim();

  return movimentacoes.filter((movimentacao) => {
    const produto = produtoPorId.get(movimentacao.produtoId);
    const correspondeTipo = tipo === 'todas' || movimentacao.tipo === tipo;
    const correspondeProduto = !produtoSelecionadoId || movimentacao.produtoId === produtoSelecionadoId;
    const correspondeCategoria = !categoriaSelecionada || produto?.categoria === categoriaSelecionada;

    return correspondeTipo && correspondeProduto && correspondeCategoria;
  });
}

/**
 * @param {{
 *   produtoId?: string | null,
 *   produtoSelecionado?: any,
 *   varianteId?: string,
 *   quantidade?: string | number,
 *   motivo?: string,
 *   tipo?: 'entrada' | 'saida'
 * }} dados
 */
export function validarMovimentacao({
  produtoId,
  produtoSelecionado,
  varianteId,
  quantidade,
  motivo,
  tipo,
}) {
  const erros = {};
  const quantidadeTexto = String(quantidade ?? '').trim();
  const quantidadeNumero = Number(quantidadeTexto);

  if (!produtoId) {
    erros.produto = 'Selecione um produto.';
  } else if (produtoSelecionado?.variantes?.length && !varianteId) {
    erros.produto = 'Selecione uma característica do produto.';
  }

  if (!/^(?:[1-9]\d*)$/.test(quantidadeTexto)) {
    erros.quantidade = 'Informe um número inteiro maior que zero.';
  }

  if (!motivo) {
    erros.motivo = 'Selecione um motivo.';
  }

  if (tipo === 'saida') {
    const estoqueDisponivel = produtoSelecionado?.variantes?.length
      ? produtoSelecionado.variantes.find((item) => item.id === varianteId)?.quantidade ?? 0
      : Number(produtoSelecionado?.quantidade ?? 0);

    if (quantidadeNumero > 0 && quantidadeNumero > estoqueDisponivel) {
      erros.quantidade = `Estoque insuficiente: há ${estoqueDisponivel} unidades nessa característica.`;
    }
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  };
}

/**
 * @param {any[]} produtos
 * @param {string | number} codigo
 * @returns {any | null}
 */
export function encontrarProdutoPorCodigo(produtos, codigo) {
  const codigoNormalizado = normalizarCodigoBarras(codigo);
  return produtos.find((produto) => normalizarCodigoBarras(produto?.codigoBarras ?? '') === codigoNormalizado) ?? null;
}

/**
 * @param {{
 *   nome?: string,
 *   categoria?: string,
 *   quantidade?: string | number,
 *   estoqueMinimo?: string | number,
 *   codigoBarras?: string,
 *   variantes?: Array<{ id?: string, caracteristica?: string, quantidade?: string | number }> 
 * }} dados
 */
export function validarProduto({
  nome,
  categoria,
  quantidade,
  estoqueMinimo,
  codigoBarras,
  variantes = [],
}) {
  const erros = {};

  const nomeNormalizado = normalizarTextoProduto(nome);
  const categoriaNormalizada = normalizarTextoProduto(categoria);
  const codigoNormalizado = normalizarCodigoBarras(codigoBarras);
  const quantidadeNumero = Number(quantidade);
  const estoqueMinimoNumero = Number(estoqueMinimo);

  if (!nomeNormalizado) {
    erros.nome = 'O nome é obrigatório.';
  }

  if (!categoriaNormalizada) {
    erros.categoria = 'A categoria é obrigatória.';
  }

  if (!Number.isInteger(quantidadeNumero) || quantidadeNumero < 0) {
    erros.quantidade = 'Quantidade deve ser um número inteiro maior ou igual a zero.';
  }

  if (!Number.isInteger(estoqueMinimoNumero) || estoqueMinimoNumero < 0) {
    erros.estoqueMinimo = 'Estoque mínimo deve ser um número inteiro maior ou igual a zero.';
  }

  if (variantes.length > 0) {
    const nomesVariantes = variantes.map((variante) => normalizarTextoProduto(variante?.caracteristica));
    if (nomesVariantes.some((item) => !item)) {
      erros.variantes = 'Preencha cada característica.';
    }
    if (new Set(nomesVariantes).size !== nomesVariantes.length) {
      erros.variantes = 'As características não podem se repetir.';
    }

    const totalVariantes = variantes.reduce((total, variante) => {
      const valor = Number(variante?.quantidade ?? 0);
      return total + (Number.isInteger(valor) && valor >= 0 ? valor : 0);
    }, 0);

    if (totalVariantes !== quantidadeNumero && quantidadeNumero >= 0) {
      erros.variantes = 'A soma das características precisa bater com a quantidade inicial.';
    }
  }

  if (codigoNormalizado && !/^\d+$/.test(codigoNormalizado)) {
    erros.codigoBarras = 'O código de barras deve conter apenas números.';
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  };
}

/**
 * @param {{
 *   nome?: string,
 *   categoria?: string,
 *   quantidade?: string | number,
 *   estoqueMinimo?: string | number,
 *   codigoBarras?: string,
 *   variantes?: Array<{ id?: string, caracteristica?: string, quantidade?: string | number }> 
 * }} dados
 */
export function montarDadosProduto({
  nome,
  categoria,
  quantidade,
  estoqueMinimo,
  codigoBarras,
  variantes = [],
}) {
  const dados = {
    nome: normalizarTextoProduto(nome),
    categoria: normalizarTextoProduto(categoria),
    quantidade: Number(quantidade) || 0,
    estoqueMinimo: Number(estoqueMinimo) || 0,
  };

  if (variantes.length > 0) {
    dados.variantes = variantes.map((variante) => ({
      id: String(variante.id ?? `${Date.now()}-${Math.random()}`),
      caracteristica: normalizarTextoProduto(variante.caracteristica),
      quantidade: Number(variante.quantidade) || 0,
    }));
    dados.quantidade = dados.variantes.reduce((total, variante) => total + variante.quantidade, 0);
  }

  const codigoNormalizado = normalizarCodigoBarras(codigoBarras);
  if (codigoNormalizado) {
    dados.codigoBarras = codigoNormalizado;
  }

  return dados;
}

export function criarProdutoNaLista(produtos, dados) {
  return [...produtos, { id: String(dados.id ?? Date.now()), ...dados }];
}

export function atualizarProdutoNaLista(produtos, id, dadosAtualizados) {
  return produtos.map((produto) => (produto.id === id ? { ...produto, ...dadosAtualizados } : produto));
}

export function removerProdutoDaLista(produtos, id) {
  return produtos.filter((produto) => produto.id !== id);
}
