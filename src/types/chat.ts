import { ChatGroup } from './group';
import { ChatUser } from './user';

export type ConversationType = 'direct' | 'group';

export type MessageTarget =
  | { type: 'conversation' }
  | { type: 'member'; memberId: string };

export type ChatMessage = {
  id: string;
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  text: string;
  target: MessageTarget;
  mentionedUserIds: string[];
  createdAt: number;
};

export type DirectConversation = {
  id: string;
  participants: string[];
  createdAt: number;
};

// Dados que a rota carrega antes de abrir a tela de chat
export type ChatRouteData = {
  conversationId: string;
  conversationType: ConversationType;
  title: string;
  photoUrl: string;
  otherUser: ChatUser | null;
  group: ChatGroup | null;
  members: ChatUser[];
};
