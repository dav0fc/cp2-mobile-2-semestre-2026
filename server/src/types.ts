export type NotificationPolicy =
  | 'all_group_messages'
  | 'mentioned_members'
  | 'direct_messages_only'
  | 'disabled';

export type MessageTarget =
  | { type: 'conversation' }
  | { type: 'member'; memberId: string };

// Formato da mensagem como ela chega do Realtime Database
export type StoredMessage = {
  conversationId: string;
  conversationType: 'direct' | 'group';
  senderId: string;
  text: string;
  target: MessageTarget;
  mentionedUserIds: string[];
  createdAt: number;
};

export type DeviceRecord = {
  token: string;
  platform: string;
  enabled: boolean;
  updatedAt: number;
};
