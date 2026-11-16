import { Platform } from 'react-native';

type ProdutoBaixo = {
  id: string;
  nome: string;
  quantidade: number;
  estoqueMinimo: number;
};

const MINUTOS_ENTRE_AVISOS = 60_000;

let ultimoAviso: { quantidade: number; timestamp: number } | null = null;

function deveEmitirAviso(quantidade: number): boolean {
  if (quantidade <= 0) return false;
  const agora = Date.now();

  if (!ultimoAviso) {
    return true;
  }

  const mudouQuantidade = ultimoAviso.quantidade !== quantidade;
  const passouTempoMinimo = agora - ultimoAviso.timestamp >= MINUTOS_ENTRE_AVISOS;

  return mudouQuantidade || passouTempoMinimo;
}

function bodyMensagem(quantidade: number, lista?: ProdutoBaixo[]) {
  if (lista && lista.length > 0) {
    const nomes = lista.slice(0, 3).map((item) => item.nome);
    const restante = lista.length - nomes.length;

    if (restante > 0) {
      return `${nomes.join(', ')} e mais ${restante} produto${restante > 1 ? 's' : ''} abaixo do mínimo.`;
    }

    return `${nomes.join(', ')} estão com estoque baixo.`;
  }

  return quantidade === 1
    ? '1 produto está com estoque baixo.'
    : `${quantidade} produtos estão com estoque baixo.`;
}

export async function notificarEstoqueBaixo(quantidadeOuLista: number | ProdutoBaixo[]) {
  if (Platform.OS === 'web') return;

  const lista = Array.isArray(quantidadeOuLista) ? quantidadeOuLista : undefined;
  const quantidade = Array.isArray(quantidadeOuLista)
    ? quantidadeOuLista.length
    : quantidadeOuLista;

  if (!deveEmitirAviso(quantidade)) return;

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Estoque',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const atual = await Notifications.getPermissionsAsync();
    let status = atual.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Estoque baixo',
        body: bodyMensagem(quantidade, lista),
      },
      trigger: null,
    });

    ultimoAviso = { quantidade, timestamp: Date.now() };
  } catch (erro) {
    console.log('Notificação indisponível:', erro);
  }
}