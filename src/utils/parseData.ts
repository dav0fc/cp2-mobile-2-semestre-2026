import { ChatMessage, MessageTarget } from '../types/chat';
import { ChatUser } from '../types/user';
import { ChatGroup } from '../types/group';
import { NotificationPolicy } from '../types/notification';

// Pequenos helpers para ler dados do Firebase sem perder o tipagem

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

const POLICIES: NotificationPolicy[] = [
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
];

export function parseUserDoc(id: string, data: Record<string, unknown> | undefined): ChatUser | null {
  if (!data) return null;
  return {
    uid: id,
    name: asString(data.name, 'Usuário'),
    email: asString(data.email),
    phoneNumber: asString(data.phoneNumber),
    birthDate: asString(data.birthDate),
    photoUrl: asString(data.photoUrl),
    createdAt: asNumber(data.createdAt, Date.now()),
  };
}

export function parseGroupDoc(id: string, data: Record<string, unknown> | undefined): ChatGroup | null {
  if (!data) return null;
  const policy = asString(data.notificationPolicy);
  const notificationPolicy: NotificationPolicy = POLICIES.includes(policy as NotificationPolicy)
    ? (policy as NotificationPolicy)
    : 'disabled';
  return {
    id,
    name: asString(data.name, 'Grupo sem nome'),
    photoUrl: asString(data.photoUrl),
    ownerId: asString(data.ownerId),
    memberIds: asStringArray(data.memberIds),
    memberLimit: asNumber(data.memberLimit, 2),
    notificationPolicy,
    createdAt: asNumber(data.createdAt, Date.now()),
    updatedAt: asNumber(data.updatedAt, Date.now()),
  };
}

export function parseMessageTarget(value: unknown): MessageTarget {
  if (value && typeof value === 'object') {
    const target = value as Record<string, unknown>;
    if (target.type === 'member' && typeof target.memberId === 'string') {
      return { type: 'member', memberId: target.memberId };
    }
  }
  return { type: 'conversation' };
}

export function parseRtdbMessage(id: string, value: unknown): ChatMessage | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.text !== 'string' || data.text.length === 0) return null;
  if (data.conversationType !== 'direct' && data.conversationType !== 'group') return null;
  return {
    id,
    conversationId: asString(data.conversationId),
    conversationType: data.conversationType,
    senderId: asString(data.senderId),
    text: data.text,
    target: parseMessageTarget(data.target),
    mentionedUserIds: asStringArray(data.mentionedUserIds),
    createdAt: asNumber(data.createdAt, Date.now()),
  };
}
