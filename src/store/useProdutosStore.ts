import { create } from 'zustand';
import type { Produto } from '../types';
import {
  atualizarProduto,
  buscarProduto,
  criarProduto,
  listarProdutos,
  removerProduto,
} from '../services/produtosService';

type DadosNovoProduto = Omit<Produto, 'id' | 'criadoEm'>;

type ProdutosState = {
  produtos: Produto[];
  carregando: boolean;
  erro: string | null;
  carregar: (uid: string) => Promise<void>;
  adicionar: (uid: string, dados: DadosNovoProduto) => Promise<string>;
  editar: (uid: string, id: string, dados: Partial<Produto>) => Promise<void>;
  remover: (uid: string, id: string) => Promise<void>;
};

function textoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

export const useProdutosStore = create<ProdutosState>((set, get) => ({
  produtos: [],
  carregando: false,
  erro: null,

  carregar: async (uid) => {
    set({ carregando: true, erro: null });
    try {
      set({ produtos: await listarProdutos(uid) });
    } catch (erro) {
      set({ erro: textoErro(erro) });
      throw erro;
    } finally {
      set({ carregando: false });
    }
  },

  adicionar: async (uid, dados) => {
    set({ erro: null });
    try {
      const id = await criarProduto(uid, dados);
      const produto = await buscarProduto(uid, id);
      if (produto) set({ produtos: [...get().produtos, produto].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) });
      return id;
    } catch (erro) {
      set({ erro: textoErro(erro) });
      throw erro;
    }
  },

  editar: async (uid, id, dados) => {
    set({ erro: null });
    try {
      await atualizarProduto(uid, id, dados);
      set({ produtos: get().produtos.map((produto) => (produto.id === id ? { ...produto, ...dados, id } : produto)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) });
    } catch (erro) {
      set({ erro: textoErro(erro) });
      throw erro;
    }
  },

  remover: async (uid, id) => {
    set({ erro: null });
    try {
      await removerProduto(uid, id);
      set({ produtos: get().produtos.filter((produto) => produto.id !== id) });
    } catch (erro) {
      set({ erro: textoErro(erro) });
      throw erro;
    }
  },
}));
