import { Platform } from 'react-native';

// Garante no máximo uma notificação por abertura do app
let jaNotificou = false;

export async function notificarEstoqueBaixo(quantidade: number) {
  // Notificações não funcionam no navegador
  if (Platform.OS === 'web') return;
  if (jaNotificou || quantidade <= 0) return;

  try {
    // Import dentro da função: na web o módulo nem chega a ser carregado
    const Notifications = await import('expo-notifications');

    // Define como a notificação aparece com o app aberto
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // No Android é preciso criar um canal antes de pedir permissão
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Estoque',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Pede permissão (se ainda não tiver)
    const atual = await Notifications.getPermissionsAsync();
    let status = atual.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    // Dispara a notificação local na hora (trigger: null)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Estoque baixo',
        body:
          quantidade === 1
            ? '1 produto está com estoque baixo.'
            : `${quantidade} produtos estão com estoque baixo.`,
      },
      trigger: null,
    });

    jaNotificou = true;
  } catch (e) {
    // Se falhar (ex.: limitação do Expo Go), o app segue normalmente
    console.log('Notificação indisponível:', e);
  }
}