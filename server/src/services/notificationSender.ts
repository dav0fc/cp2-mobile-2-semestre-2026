import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from './firebaseAdmin';

// Códigos do FCM que indicam token inválido/obsoleto
const INVALID_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  'messaging/invalid-recipient',
  'messaging/failed-to-register',
];

export type PushPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

type DeviceWithOwner = {
  uid: string;
  deviceId: string;
  token: string;
};

// Busca os dispositivos ativos de um usuario (tokens validos)
function getDevices(uid: string): Promise<DeviceWithOwner[]> {
  return getFirestore()
    .collection(`users/${uid}/devices`)
    .where('enabled', '==', true)
    .get()
    .then((snapshot) =>
      snapshot.docs
        .map((doc) => {
          const data = doc.data() as { token?: unknown };
          return { uid, deviceId: doc.id, token: typeof data.token === 'string' ? data.token : '' };
        })
        .filter((device) => device.token.length > 0)
    );
}

// Token invalido: remove o registro para nao tentar de novo
async function removeInvalidDevice(uid: string, deviceId: string): Promise<void> {
  try {
    await getFirestore().doc(`users/${uid}/devices/${deviceId}`).delete();
  } catch (erro) {
    console.error(`Falha ao remover token invalido ${deviceId} de ${uid}:`, erro);
  }
}

// Envia o push para os dispositivos dos destinatarios, um por um
// (a quantidade de dispositivos por aluno e pequena, entao sequencial
// simplifica o tratamento de erro e a limpeza de token invalido)
export async function deliverNotifications(
  recipientUids: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const messaging = getAdminApp().messaging();
  let sent = 0;
  let failed = 0;

  for (const uid of recipientUids) {
    const devices = await getDevices(uid);
    for (const device of devices) {
      try {
        await messaging.send({
          token: device.token,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
        });
        sent += 1;
      } catch (erro) {
        failed += 1;
        const code = (erro as { code?: string }).code ?? '';
        if (INVALID_TOKEN_CODES.includes(code)) {
          await removeInvalidDevice(device.uid, device.deviceId);
        } else {
          console.error(`Falha ao enviar push para o dispositivo ${device.deviceId}:`, code);
        }
      }
    }
  }

  return { sent, failed };
}
