import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRecipients } from '../src/services/recipientResolver';

const base = {
  senderId: 'alice',
  conversationType: 'group' as const,
  target: { type: 'conversation' } as const,
  mentionedUserIds: [] as string[],
};

test('conversa individual notifica o outro participante', () => {
  const recipients = resolveRecipients({
    ...base,
    conversationType: 'direct',
    participants: ['alice', 'bob'],
  });
  assert.deepEqual(recipients, ['bob']);
});

test('conversa individual nao notifica o proprio remetente', () => {
  const recipients = resolveRecipients({
    ...base,
    conversationType: 'direct',
    participants: ['alice'],
  });
  assert.deepEqual(recipients, []);
});

test('all_group_messages notifica todos menos o remetente', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob', 'carol'],
    policy: 'all_group_messages',
  });
  assert.deepEqual(recipients.sort(), ['bob', 'carol']);
});

test('mentioned_members com destino explicito so notifica o membro escolhido', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob', 'carol'],
    policy: 'mentioned_members',
    target: { type: 'member', memberId: 'carol' },
  });
  assert.deepEqual(recipients, ['carol']);
});

test('mentioned_members ignora destino que nao e integrante', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob'],
    policy: 'mentioned_members',
    target: { type: 'member', memberId: 'stranger' },
  });
  assert.deepEqual(recipients, []);
});

test('mentioned_members com mensagem geral usa a lista de mencoes', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob', 'carol', 'dave'],
    policy: 'mentioned_members',
    mentionedUserIds: ['bob', 'dave', 'stranger'],
  });
  assert.deepEqual(recipients.sort(), ['bob', 'dave']);
});

test('mentioned_members nao notifica o remetente mesmo mencionado', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob'],
    policy: 'mentioned_members',
    mentionedUserIds: ['alice'],
  });
  assert.deepEqual(recipients, []);
});

test('direct_messages_only nao notifica mensagens de grupo', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob'],
    policy: 'direct_messages_only',
  });
  assert.deepEqual(recipients, []);
});

test('direct_messages_only continua notificando conversas individuais', () => {
  const recipients = resolveRecipients({
    ...base,
    conversationType: 'direct',
    participants: ['alice', 'bob'],
    policy: 'direct_messages_only',
  });
  assert.deepEqual(recipients, ['bob']);
});

test('disabled nao notifica ninguem', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice', 'bob', 'carol'],
    policy: 'disabled',
  });
  assert.deepEqual(recipients, []);
});

test('grupo sem integrantes alem do remetente nao gera destinatarios', () => {
  const recipients = resolveRecipients({
    ...base,
    participants: ['alice'],
    policy: 'all_group_messages',
  });
  assert.deepEqual(recipients, []);
});
