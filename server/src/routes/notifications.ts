import { Request, Response, Router } from 'express';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { authenticate } from '../middleware/authenticate';
import { resolveRecipients } from '../services/recipientResolver';
import { deliverNotifications, PushPayload } from '../services/notificationSender';
import { getAdminApp } from '../services/firebaseAdmin';
import { MessageTarget, NotificationPolicy, StoredMessage } from '../types';

const router = Router();

function parseTarget(value: unknown): MessageTarget {
  if (value && typeof value === 'object') {
    const target = value as { type?: unknown; memberId?: unknown };
    if (target.type === 'member' && typeof target.memberId === 'string') {
      return { type: 'member', memberId: target.memberId };
    }
  }
  return { type: 'conversation' };
}

// Converte o que veio do RTDB em StoredMessage tipado (null se nao confere)
function parseStoredMessage(value: unknown): StoredMessage | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.text !== 'string' || data.text.length === 0) return null;
  if (data.conversationType !== 'direct' && data.conversationType !== 'group') return null;
  if (typeof data.senderId !== 'string') return null;
  return {
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : '',
    conversationType: data.conversationType,
    senderId: data.senderId,
    text: data.text,
    target: parseTarget(data.target),
    mentionedUserIds: Array.isArray(data.mentionedUserIds)
      ? data.mentionedUserIds.filter((item): item is string => typeof item === 'string')
      : [],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

const POLICIES: NotificationPolicy[] = [
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
];

function parsePolicy(value: unknown): NotificationPolicy {
  return POLICIES.includes(value as NotificationPolicy) ? (value as NotificationPolicy) : 'disabled';
}

type ConversationInfo = {
  participants: string[];
  policy: NotificationPolicy;
  groupTitle?: string;
};

// Busca participantes e politica no Firestore (a fonte da verdade)
async function loadConversation(
  conversationId: string,
  conversationType: 'direct' | 'group'
): Promise<ConversationInfo | null> {
  const db = getFirestore();

  if (conversationType === 'direct') {
    const snapshot = await db.collection('directConversations').doc(conversationId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() as { participantIds?: unknown };
    const participants = Array.isArray(data.participantIds)
      ? data.participantIds.filter((item): item is string => typeof item === 'string')
      : [];
    // Conversa individual sempre notifica o outro lado
    return { participants, policy: 'all_group_messages' };
  }

  const snapshot = await db.collection('groups').doc(conversationId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as { memberIds?: unknown; notificationPolicy?: unknown; name?: unknown };
  const participants = Array.isArray(data.memberIds)
    ? data.memberIds.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    participants,
    policy: parsePolicy(data.notificationPolicy),
    groupTitle: typeof data.name === 'string' ? data.name : 'Grupo',
  };
}

// Garante que a mesma mensagem nao gere push duas vezes: a marca de
// "enviado" e gravada dentro da mesma transacao que verifica a ausencia
async function markNotificationSent(messageId: string, conversationId: string): Promise<boolean> {
  const db = getFirestore();
  const dedupRef = db.collection('sentNotifications').doc(messageId);
  let alreadySent = false;

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(dedupRef);
    if (snapshot.exists) {
      alreadySent = true;
      return;
    }
    tx.set(dedupRef, { sentAt: Date.now(), conversationId });
  });

  return !alreadySent;
}

// POST /notifications/messages
// Body: { conversationId, messageId }
// O app so pede; a API e que valida e decide quem recebe.
router.post(
  '/notifications/messages',
  authenticate,
  async (req: Request, res: Response) => {
    const uid = req.uid ?? null;
    try {
      const body = req.body as { conversationId?: unknown; messageId?: unknown };
      const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : null;
      const messageId = typeof body?.messageId === 'string' ? body.messageId : null;
      if (!conversationId || !messageId) {
        res.status(400).json({ error: 'conversationId e messageId sao obrigatorios.' });
        return;
      }

      // 1) Confere no Realtime Database se a mensagem existe e se o
      //    remetente bate com o usuario autenticado
      const messageSnapshot = await getDatabase()
        .ref(`messages/${conversationId}/${messageId}`)
        .get();
      const message = parseStoredMessage(messageSnapshot.val());
      if (!message || !uid || message.senderId !== uid) {
        res.status(400).json({ error: 'Mensagem invalida ou remetente nao confere.' });
        return;
      }

      // 2) Participantes e politica no Firestore
      const conversation = await loadConversation(conversationId, message.conversationType);
      if (!conversation) {
        res.status(404).json({ error: 'Conversa nao encontrada.' });
        return;
      }
      // Remetente removido do grupo nao gera mais push
      if (!conversation.participants.includes(uid)) {
        res.status(200).json({ recipients: 0, skipped: 'remetente nao e mais participante' });
        return;
      }

      // 3) Destinatarios conforme a politica
      const recipients = resolveRecipients({
        senderId: uid,
        participants: conversation.participants,
        conversationType: message.conversationType,
        policy: conversation.policy,
        target: message.target,
        mentionedUserIds: message.mentionedUserIds,
      });
      if (recipients.length === 0) {
        res.status(200).json({ recipients: 0 });
        return;
      }

      // 4) Antiduplicata (requisicao reenviada nao reenvia push)
      const firstTime = await markNotificationSent(messageId, conversationId);
      if (!firstTime) {
        res.status(409).json({ error: 'Notificacao ja enviada para esta mensagem.' });
        return;
      }

      // 5) Entrega. Texto sem detalhes da mensagem (privacidade)
      const payload: PushPayload =
        message.conversationType === 'group'
          ? {
              title: conversation.groupTitle ?? 'Grupo',
              body: 'Nova mensagem no grupo.',
              data: {
                conversationId,
                conversationType: 'group',
                messageId,
                senderId: uid,
              },
            }
          : {
              title: 'Nova mensagem',
              body: 'Voce recebeu uma mensagem no FrutigerChat.',
              data: {
                conversationId,
                conversationType: 'direct',
                messageId,
                senderId: uid,
              },
            };

      const result = await deliverNotifications(recipients, payload);
      console.log(
        `Push da mensagem ${messageId}: ${result.sent} enviado(s), ${result.failed} falha(s), destinatarios: ${recipients.length}`
      );
      res.status(200).json({
        recipients: recipients.length,
        sent: result.sent,
        failed: result.failed,
      });
    } catch (erro) {
      console.error('Erro ao processar notificacao:', erro);
      res.status(500).json({ error: 'Erro interno ao processar a notificacao.' });
    }
  }
);

export default router;
