import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { ChatUser } from '../types/user';
import { findOrCreateConversation, sendMessage, listenToMessages } from '../services/chatService';

type UseChatResult = {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  startConversation: (otherUser: ChatUser) => Promise<string>;
};

export function useChat(
  myUserId: string,
  myProvider: 'password' | 'google' | 'apple'
): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      const unsub = listenToMessages(currentConversationId, (fetchedMessages) => {
        setMessages((previous) => fetchedMessages);
      });
      unsubscribeRef.current = unsub;
      return () => unsub();
    }
    setMessages([]);
  }, [currentConversationId]);

  const startConversation = useCallback(
    async (otherUser: ChatUser): Promise<string> => {
      if (otherUser.uid === myUserId) {
        throw new Error('Não é possível conversar consigo mesmo.');
      }
      setLoading(true);
      setError(null);
      try {
        const conversationId = await findOrCreateConversation(myUserId, otherUser.uid);
        setCurrentConversationId(conversationId);
        setOtherUserId(otherUser.uid);
        setLoading(false);
        return conversationId;
      } catch (err) {
        const message = (err as { message?: string }).message ?? 'Erro ao iniciar conversa';
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
    },
    [myUserId]
  );

  const sendMessageCallback = useCallback(
    async (text: string) => {
      if (!text.trim() || sending || !currentConversationId || !otherUserId) return;
      if (otherUserId === myUserId) {
        setError('Não é possível enviar mensagem para si mesmo.');
        return;
      }
      setSending(true);
      setError(null);
      try {
        await sendMessage(currentConversationId, myUserId, otherUserId, text.trim());
        setSending(false);
      } catch (err) {
        const message = (err as { message?: string }).message ?? 'Erro ao enviar mensagem';
        setError(message);
        setSending(false);
        throw new Error(message);
      }
    },
    [myUserId, otherUserId, currentConversationId, sending]
  );

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage: sendMessageCallback,
    startConversation,
  };
}
