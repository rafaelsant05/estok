import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Produto } from '../types';

type DadosProduto = Omit<Produto, 'id' | 'criadoEm'>;

function produtosRef(uid: string) {
  return collection(db, 'users', uid, 'produtos');
}

function mensagemErro(acao: string, erro: unknown): Error {
  const detalhe = erro instanceof Error ? erro.message : 'erro desconhecido';
  return new Error(`Não foi possível ${acao}: ${detalhe}`);
}

// Remove os opcionais vazios antes de enviar ao Firestore.
function limparDados<T extends Record<string, unknown>>(dados: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dados).filter(([, valor]) => valor !== undefined && valor !== ''),
  ) as Partial<T>;
}

export async function criarProduto(uid: string, dados: DadosProduto): Promise<string> {
  try {
    const ref = await addDoc(produtosRef(uid), {
      ...limparDados(dados),
      criadoEm: Date.now(),
    });
    return ref.id;
  } catch (erro) {
    throw mensagemErro('criar o produto', erro);
  }
}

export async function listarProdutos(uid: string): Promise<Produto[]> {
  try {
    const snapshot = await getDocs(produtosRef(uid));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as Produto)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } catch (erro) {
    throw mensagemErro('listar os produtos', erro);
  }
}

export async function buscarProduto(uid: string, id: string): Promise<Produto | null> {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid, 'produtos', id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Produto) : null;
  } catch (erro) {
    throw mensagemErro('buscar o produto', erro);
  }
}

export async function buscarPorCodigoBarras(uid: string, codigo: string): Promise<Produto | null> {
  try {
    const resultado = await getDocs(
      query(produtosRef(uid), where('codigoBarras', '==', codigo)),
    );
    const item = resultado.docs[0];
    return item ? ({ id: item.id, ...item.data() } as Produto) : null;
  } catch (erro) {
    throw mensagemErro('buscar o código de barras', erro);
  }
}

export async function atualizarProduto(
  uid: string,
  id: string,
  dados: Partial<Produto>,
): Promise<void> {
  try {
    const { id: _id, criadoEm: _criadoEm, ...campos } = dados;
    await updateDoc(doc(db, 'users', uid, 'produtos', id), limparDados(campos));
  } catch (erro) {
    throw mensagemErro('atualizar o produto', erro);
  }
}

export async function removerProduto(uid: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'produtos', id));
  } catch (erro) {
    throw mensagemErro('remover o produto', erro);
  }
}
