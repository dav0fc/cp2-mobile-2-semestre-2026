import { useEffect, useRef, useState } from 'react';
import { ChatUser } from '../types/user';
import {
  ensureNotificationPermission,
  listenForNotificationTaps,
  NotificationTapData,
  PermissionStatus,
  registerDeviceToken,
} from '../services/notificationService';

type UseNotificationsResult = {
  permission: PermissionStatus | 'loading' | 'none';
  tokenRegistered: boolean;
};

// Cuida de tudo que o app precisa fazer do lado do push:
// permissao, registro do token e o toque na notificacao.
export function useNotifications(
  user: ChatUser | null,
  onTap: (data: NotificationTapData) => void
): UseNotificationsResult {
  const [permission, setPermission] = useState<PermissionStatus | 'loading' | 'none'>('none');
  const [tokenRegistered, setTokenRegistered] = useState(false);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setPermission('none');
      setTokenRegistered(false);
      return;
    }

    let ativo = true;
    setPermission('loading');
    setTokenRegistered(false);

    (async () => {
      try {
        const status = await ensureNotificationPermission();
        if (!ativo) return;
        setPermission(status);
        if (status === 'granted') {
          const ok = await registerDeviceToken(uid);
          if (ativo) setTokenRegistered(ok);
        }
      } catch (erro) {
        console.error('Erro ao registrar o dispositivo para push:', erro);
        if (ativo) setPermission('denied');
      }
    })();

    return () => {
      ativo = false;
    };
  }, [uid]);

  // Guarda o callback mais recente sem recriar o listener
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onTapRef.current = onTap;
  }, [onTap]);

  useEffect(() => {
    return listenForNotificationTaps((data) => onTapRef.current(data));
  }, []);

  return { permission, tokenRegistered };
}
