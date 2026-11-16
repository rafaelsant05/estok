import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarProdutoNaLista,
  filtrarMovimentacoes,
  filtrarProdutos,
  encontrarProdutoPorCodigo,
  montarDadosProduto,
  normalizarCodigoBarras,
  removerProdutoDaLista,
  atualizarProdutoNaLista,
  validarMovimentacao,
  validarProduto,
} from './negocio.js';

const produtos = [
  {
    id: '1',
    nome: 'Café',
    categoria: 'Bebidas',
    quantidade: 12,
    estoqueMinimo: 8,
    codigoBarras: '7891234567890',
  },
  {
    id: '2',
    nome: 'Açúcar',
    categoria: 'Padaria',
    quantidade: 3,
    estoqueMinimo: 5,
    codigoBarras: '1234567890123',
  },
  {
    id: '3',
    nome: 'Leite',
    categoria: 'Bebidas',
    quantidade: 20,
    estoqueMinimo: 4,
    codigoBarras: '9876543210987',
  },
];

test('filtra produtos por busca e categoria', () => {
  const resultado = filtrarProdutos(produtos, {
    busca: 'caf',
    categoria: 'Bebidas',
  });

  assert.deepEqual(resultado.map((produto) => produto.id), ['1']);
});

test('normaliza código de barras em busca', () => {
  assert.equal(normalizarCodigoBarras(' 7891234567890 '), '7891234567890');
});

test('bloqueia saida maior que estoque', () => {
  const validacao = validarMovimentacao({
    produtoId: '2',
    produtoSelecionado: produtos[1],
    varianteId: '',
    quantidade: '10',
    motivo: 'venda',
    tipo: 'saida',
  });

  assert.equal(validacao.valido, false);
  assert.match(validacao.erros.quantidade, /Estoque insuficiente/);
});

test('aceita saida dentro do estoque e busca por codigo', () => {
  const validacao = validarMovimentacao({
    produtoId: '1',
    produtoSelecionado: produtos[0],
    varianteId: '',
    quantidade: '5',
    motivo: 'venda',
    tipo: 'saida',
  });

  assert.equal(validacao.valido, true);
  assert.equal(encontrarProdutoPorCodigo(produtos, '7891234567890')?.nome, 'Café');
});

test('filtra movimentacoes por tipo, produto e categoria', () => {
  const produtoMap = new Map(produtos.map((produto) => [produto.id, produto]));
  const movimentacoes = [
    { id: 'm1', produtoId: '1', produtoNome: 'Café', tipo: 'saida', quantidade: 2, motivo: 'venda', data: 1 },
    { id: 'm2', produtoId: '2', produtoNome: 'Açúcar', tipo: 'entrada', quantidade: 5, motivo: 'compra', data: 2 },
    { id: 'm3', produtoId: '3', produtoNome: 'Leite', tipo: 'saida', quantidade: 1, motivo: 'uso_proprio', data: 3 },
  ];

  const resultado = filtrarMovimentacoes(
    movimentacoes,
    {
      tipo: 'saida',
      produtoId: '1',
      categoria: 'Bebidas',
    },
    produtoMap,
  );

  assert.deepEqual(resultado.map((movimentacao) => movimentacao.id), ['m1']);
});

test('valida produto novo e monta dados do cadastro com normalizacao', () => {
  const dados = montarDadosProduto({
    nome: '  Cimento 50kg  ',
    categoria: '  Construção  ',
    quantidade: '4',
    estoqueMinimo: '2',
    codigoBarras: ' 1234567890123 ',
    variantes: [
      { id: 'v1', caracteristica: '  Vermelha  ', quantidade: '2' },
      { id: 'v2', caracteristica: ' Azul ', quantidade: '2' },
    ],
  });

  assert.equal(validarProduto({
    nome: 'Cimento 50kg',
    categoria: 'Construção',
    quantidade: '4',
    estoqueMinimo: '2',
    codigoBarras: '1234567890123',
    variantes: [
      { caracteristica: 'Vermelha', quantidade: '2' },
      { caracteristica: 'Azul', quantidade: '2' },
    ],
  }).valido, true);
  assert.equal(dados.nome, 'Cimento 50kg');
  assert.equal(dados.categoria, 'Construção');
  assert.equal(dados.quantidade, 4);
  assert.equal(dados.estoqueMinimo, 2);
  assert.equal(dados.codigoBarras, '1234567890123');
  assert.deepEqual(dados.variantes.map((variante) => variante.caracteristica), ['Vermelha', 'Azul']);
});

test('cria, atualiza e remove produto da lista em um fluxo de CRUD', () => {
  const listaInicial = [];
  const produtoCriado = {
    id: 'novo-1',
    nome: 'Argamassa',
    categoria: 'Construção',
    quantidade: 6,
    estoqueMinimo: 2,
    codigoBarras: '1111111111111',
  };

  const listaComProduto = criarProdutoNaLista(listaInicial, produtoCriado);
  assert.equal(listaComProduto.length, 1);
  assert.equal(listaComProduto[0].nome, 'Argamassa');

  const listaAtualizada = atualizarProdutoNaLista(listaComProduto, 'novo-1', {
    nome: 'Argamassa Premium',
    estoqueMinimo: 3,
  });

  assert.equal(listaAtualizada[0].nome, 'Argamassa Premium');
  assert.equal(listaAtualizada[0].estoqueMinimo, 3);

  const listaFinal = removerProdutoDaLista(listaAtualizada, 'novo-1');
  assert.deepEqual(listaFinal, []);
});
