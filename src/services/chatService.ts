import { ref, set, push, onValue, off } from 'firebase/database';
import { ChatMessage, Conversation } from '../types/chat';
import { db } from './firebase';

export type MessagesListenerCallback = (messages: ChatMessage[]) => void;

export function findOrCreateConversation(
  participant1: string,
  participant2: string
): Promise<string> {
  const id = `${participant1}_${participant2}`;
  const conversationPath = ref(db, `conversations/${id}`);
  return new Promise((resolve, reject) => {
    onValue(
      conversationPath,
      (snapshot) => {
        if (snapshot.exists()) {
          off(conversationPath);
          resolve(id);
        } else {
          const otherId = `${participant2}_${participant1}`;
          const otherPath = ref(db, `conversations/${otherId}`);
          onValue(
            otherPath,
            (otherSnapshot) => {
              off(otherPath);
              if (otherSnapshot.exists()) {
                resolve(otherId);
              } else {
                resolve(id);
                const conversationData: Conversation = {
                  id,
                  participants: [participant1, participant2],
                  createdAt: Date.now(),
                };
                set(conversationPath, conversationData);
              }
            },
            { onlyOnce: true }
          );
        }
      },
      { onlyOnce: true }
    );
  });
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  text: string
): Promise<void> {
  const messagesRef = ref(db, `messages/${conversationId}`);
  const newMessageRef = push(messagesRef);
  const message: ChatMessage = {
    id: newMessageRef.key ?? '',
    conversationId,
    senderId,
    receiverId,
    text,
    createdAt: Date.now(),
  };
  return set(newMessageRef, message);
}

export function listenToMessages(
  conversationId: string,
  callback: MessagesListenerCallback
): () => void {
  const messagesRef = ref(db, `messages/${conversationId}`);
  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const messages = Object.values(data)
          .filter((item): item is ChatMessage => item !== null && typeof item === 'object' && 'text' in item)
          .sort((a, b) => a.createdAt - b.createdAt);
        callback(messages);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to messages:', error);
    }
  );

  return () => off(messagesRef);
}
