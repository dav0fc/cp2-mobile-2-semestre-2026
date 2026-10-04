import { MessageTarget, NotificationPolicy } from '../types';

export type RecipientInput = {
  senderId: string;
  // integrantes atuais da conversa (inclui o remetente)
  participants: string[];
  conversationType: 'direct' | 'group';
  policy: NotificationPolicy;
  target: MessageTarget;
  mentionedUserIds: string[];
};

// Regras gerais: o remetente nunca recebe push da propria mensagem e
// so integrante atual da conversa pode ser destinatario.
export function resolveRecipients(input: RecipientInput): string[] {
  const { senderId, participants, conversationType, policy, target, mentionedUserIds } = input;

  const podeReceber = (uid: string): boolean =>
    uid !== senderId && participants.includes(uid);

  // Conversa individual: sempre notifica o outro lado
  if (conversationType === 'direct') {
    return participants.filter(podeReceber);
  }

  switch (policy) {
    case 'disabled':
      return [];

    case 'direct_messages_only':
      // grupos nao geram push nesta politica
      return [];

    case 'all_group_messages':
      return participants.filter(podeReceber);

    case 'mentioned_members':
      if (target.type === 'member') {
        return [target.memberId].filter(podeReceber);
      }
      return mentionedUserIds.filter(podeReceber);
  }
}
