import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { API_URL } from './firebase';
import { saveDevice } from './userService';

const DEVICE_ID_KEY = '@frutigerchat_device_id';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type NotificationTapData = {
  conversationId: string;
  conversationType: 'direct' | 'group';
};

// Id estavel do dispositivo: gerado uma vez e guardado no AsyncStorage
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function ensureNotificationPermission(): Promise<PermissionStatus> {
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.status !== 'denied') {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted ? 'granted' : permission.status === 'denied' ? 'denied' : 'undetermined';
}

// Pega o token FCM do dispositivo e registra no Firestore
// (users/{uid}/devices/{deviceId}). Retorna null quando nao ha token
// nem permissao — o chat continua funcionando, so sem push.
export async function registerDeviceToken(uid: string): Promise<boolean> {
  const permission = await ensureNotificationPermission();
  if (permission !== 'granted') return false;

  const response = await Notifications.getDevicePushTokenAsync();
  const token = response.data;
  if (!token) {
    console.warn('Dispositivo sem token de push disponivel.');
    return false;
  }

  const deviceId = await getDeviceId();
  await saveDevice(uid, deviceId, token, Platform.OS);
  return true;
}

// Extrai os dados de navegação do payload (null se nao confere)
function parseTapData(data: Record<string, unknown> | null | undefined): NotificationTapData | null {
  if (!data) return null;
  const conversationId = typeof data.conversationId === 'string' ? data.conversationId : null;
  const conversationType =
    data.conversationType === 'direct' || data.conversationType === 'group'
      ? data.conversationType
      : null;
  return conversationId && conversationType ? { conversationId, conversationType } : null;
}

export function listenForNotificationTaps(onTap: (data: NotificationTapData) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = parseTapData(response.notification.request.content.data);
    if (data) onTap(data);
  });
  return () => subscription.remove();
}

// Ultimo toque em notificacao (inclusive o que LIGOU o app fechado): devolve
// os dados e limpa o registro para nao reprocessar o mesmo toque.
// Em processo novo so existe resposta se o toque abriu o app — sem toque antigo
export function getInitialNotification(): NotificationTapData | null {
  const response = Notifications.getLastNotificationResponse();
  const data = parseTapData(response?.notification.request.content.data);
  if (data) {
    Notifications.clearLastNotificationResponse();
  }
  return data;
}

// Pede a API da equipe para enviar o push desta mensagem.
// A API e que valida tudo e calcula os destinatarios — o app so pede.
export async function requestMessageNotification(
  conversationId: string,
  messageId: string
): Promise<void> {
  if (!API_URL) {
    console.warn('EXPO_PUBLIC_API_URL nao configurada, push ignorado.');
    return;
  }
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado.');
  }
  const idToken = await currentUser.getIdToken();

  const resposta = await fetch(`${API_URL.replace(/\/$/, '')}/notifications/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ conversationId, messageId }),
  });

  if (resposta.status === 409) return; // push ja enviado para esta mensagem
  if (!resposta.ok) {
    throw new Error(`A API de notificacoes respondeu com erro ${resposta.status}.`);
  }
}
