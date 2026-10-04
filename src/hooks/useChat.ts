import { useCallback, useEffect, useState } from 'react';
import { ChatMessage, ConversationType, MessageTarget } from '../types/chat';
import { listenToMessages, sendMessage as persistMessage } from '../services/chatService';
import { requestMessageNotification } from '../services/notificationService';

type UseChatParams = {
  conversationId: string;
  conversationType: ConversationType;
  myUid: string;
};

type UseChatResult = {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (text: string, target?: MessageTarget) => Promise<void>;
};

export function useChat({ conversationId, conversationType, myUid }: UseChatParams): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // O listener vive enquanto a conversa estiver aberta e é removido
  // quando a tela desmonta ou a conversa muda
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToMessages(
      conversationId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        setLoading(false);
      },
      (mensagem) => {
        setError(mensagem);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string, target: MessageTarget = { type: 'conversation' }) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setError(null);
      try {
        const mentionedUserIds = target.type === 'member' ? [target.memberId] : [];
        const messageId = await persistMessage({
          conversationId,
          conversationType,
          senderId: myUid,
          text: trimmed,
          target,
          mentionedUserIds,
        });
        // O push nao pode travar nem atrasar a conversa: se falhar,
        // a mensagem ja esta entregue em tempo real pelo RTDB
        requestMessageNotification(conversationId, messageId).catch((erro) => {
          console.warn('Não foi possível solicitar o push da mensagem:', erro);
        });
      } catch (erro) {
        console.error('Erro ao enviar mensagem:', erro);
        setError('Não foi possível enviar a mensagem. Verifique sua conexão e tente de novo.');
        throw erro;
      } finally {
        setSending(false);
      }
    },
    [conversationId, conversationType, myUid, sending]
  );

  return { messages, loading, sending, error, sendMessage };
}
