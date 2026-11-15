import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { Movimentacao, TipoMovimentacao } from '../types';

// Dados que a tela envia para registrar uma movimentação
type DadosMovimentacao = {
  produtoId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  varianteId?: string;
  motivo: string;
  data: number; // timestamp em milissegundos
};

// Registra uma entrada ou saída e atualiza o estoque do produto
export async function registrarMovimentacao(
  uid: string,
  dados: DadosMovimentacao
): Promise<void> {
  const { produtoId, tipo, quantidade, motivo, data, varianteId } = dados;

  // Validação básica antes de falar com o Firestore
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error('A quantidade deve ser um número inteiro maior que zero.');
  }

  // Referência do produto e do novo documento de movimentação (id automático)
  const produtoRef = doc(db, 'users', uid, 'produtos', produtoId);
  const movimentacaoRef = doc(collection(db, 'users', uid, 'movimentacoes'));

  try {
    await runTransaction(db, async (transacao) => {
      // 1) LEITURA: numa transação, todas as leituras vêm antes das escritas
      const produtoSnap = await transacao.get(produtoRef);

      // 2) Produto inexistente
      if (!produtoSnap.exists()) {
        throw new Error('Produto não encontrado. Ele pode ter sido removido.');
      }

      const produto = produtoSnap.data();
      const estoqueAtual = Number(produto.quantidade) || 0;
      const variantes = Array.isArray(produto.variantes) ? produto.variantes : [];
      const variante = varianteId ? variantes.find((item) => item.id === varianteId) : undefined;
      if (variantes.length > 0 && !varianteId) throw new Error('Selecione uma característica do produto.');
      if (varianteId && !variante) throw new Error('A característica selecionada não existe mais.');
      const estoqueDisponivel = variante ? Number(variante.quantidade) || 0 : estoqueAtual;

      // 3) Saída maior que o estoque: erro e nada é alterado
      if (tipo === 'saida' && quantidade > estoqueDisponivel) {
        throw new Error(`Estoque insuficiente: há ${estoqueDisponivel} unidades nessa característica.`);
      }

      // 4) ESCRITA: atualiza a quantidade (soma na entrada, subtrai na saída)
      const novaQuantidade =
        tipo === 'entrada' ? estoqueAtual + quantidade : estoqueAtual - quantidade;
      if (variante) {
        const novasVariantes = variantes.map((item) =>
          item.id === variante.id
            ? { ...item, quantidade: tipo === 'entrada' ? estoqueDisponivel + quantidade : estoqueDisponivel - quantidade }
            : item
        );
        transacao.update(produtoRef, { quantidade: novaQuantidade, variantes: novasVariantes });
      } else {
        transacao.update(produtoRef, { quantidade: novaQuantidade });
      }

      // 5) ESCRITA: cria a movimentação, guardando o nome do produto no histórico
      transacao.set(movimentacaoRef, {
        produtoId,
        produtoNome: produto.nome,
        tipo,
        quantidade,
        ...(variante && { varianteId: variante.id, varianteNome: variante.caracteristica }),
        motivo,
        data,
      });
    });
  } catch (erro) {
    // Erros do Firebase têm "code"; os nossos (acima) não têm
    if (erro instanceof Error && !('code' in erro)) {
      throw erro; // nossa mensagem já está clara, repassa como está
    }
    if ((erro as { code?: string }).code === 'permission-denied') {
      throw new Error('Sem permissão para registrar a movimentação.');
    }
    throw new Error(
      'Não foi possível registrar a movimentação. Verifique sua conexão e tente novamente.'
    );
  }
}

// Lista as movimentações, da mais recente para a mais antiga
export async function listarMovimentacoes(
  uid: string,
  produtoId?: string
): Promise<Movimentacao[]> {
  try {
    // Busca tudo, sem where/orderBy, para não exigir índice composto no Firestore
    const snapshot = await getDocs(collection(db, 'users', uid, 'movimentacoes'));

    let lista = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Movimentacao
    );

    // Filtro por produto (feito aqui no código)
    if (produtoId) {
      lista = lista.filter((m) => m.produtoId === produtoId);
    }

    // Ordena pela data, mais recente primeiro
    return lista.sort((a, b) => b.data - a.data);
  } catch {
    throw new Error('Não foi possível carregar o histórico de movimentações.');
  }
}
