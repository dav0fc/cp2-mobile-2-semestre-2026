import { onValue, push, ref, set } from 'firebase/database';
import { collection, doc, getDoc, onSnapshot, setDoc, query, where } from 'firebase/firestore';
import { db, firestore } from './firebase';
import { ChatMessage, ConversationType, DirectConversation, MessageTarget } from '../types/chat';
import { getDirectConversationId } from '../utils/conversationId';
import { parseRtdbMessage } from '../utils/parseData';

export async function findOrCreateDirectConversation(
  uidA: string,
  uidB: string
): Promise<string> {
  const id = getDirectConversationId(uidA, uidB);
  const conversationRef = doc(firestore, 'directConversations', id);
  const snapshot = await getDoc(conversationRef);
  if (!snapshot.exists()) {
    // Dois clientes criando ao mesmo tempo cai no mesmo id com o mesmo
    // conteudo, entao o setDoc repetido nao quebra nada.
    await setDoc(conversationRef, {
      participantIds: [uidA, uidB],
      createdAt: Date.now(),
    });
  }
  return id;
}

export async function getDirectConversation(id: string): Promise<DirectConversation | null> {
  const snapshot = await getDoc(doc(firestore, 'directConversations', id));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as { participantIds?: unknown; createdAt?: unknown };
  const participants = Array.isArray(data.participantIds)
    ? data.participantIds.filter((p): p is string => typeof p === 'string')
    : [];
  return {
    id,
    participants,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

// Lista as conversas individuais do usuario (query simples de array-contains,
// nao precisa de indice composto)
export function listenToMyDirectConversations(
  uid: string,
  callback: (conversations: DirectConversation[]) => void,
  onError?: (mensagem: string) => void
): () => void {
  const q = query(
    collection(firestore, 'directConversations'),
    where('participantIds', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const conversations: DirectConversation[] = snapshot.docs.map((d) => {
        const data = d.data() as { participantIds?: unknown; createdAt?: unknown };
        const participants = Array.isArray(data.participantIds)
          ? data.participantIds.filter((p): p is string => typeof p === 'string')
          : [];
        return {
          id: d.id,
          participants,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        };
      });
      callback(conversations);
    },
    () => onError?.('Não foi possível carregar suas conversas.')
  );
}

export type NewMessageData = {
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  text: string;
  target: MessageTarget;
  mentionedUserIds: string[];
};

// Persiste a mensagem no Realtime Database e devolve o id dela
// (o id e usado depois para pedir o push na API)
export async function sendMessage(data: NewMessageData): Promise<string> {
  const messageRef = push(ref(db, `messages/${data.conversationId}`));
  const message: ChatMessage = {
    ...data,
    id: messageRef.key ?? '',
    createdAt: Date.now(),
  };
  await set(messageRef, message);
  return message.id;
}

// Listener das mensagens da conversa; o retorno remove o listener
export function listenToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (mensagem: string) => void
): () => void {
  const messagesRef = ref(db, `messages/${conversationId}`);
  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([id, value]) => parseRtdbMessage(id, value))
          .filter((message): message is ChatMessage => message !== null)
          .sort((a, b) => a.createdAt - b.createdAt);
        callback(messages);
      } else {
        callback([]);
      }
    },
    (erro) => {
      console.error('Erro ao ouvir mensagens:', erro);
      onError?.('Não foi possível carregar as mensagens.');
    }
  );
  return unsubscribe;
}
