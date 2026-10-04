export type NotificationPolicy =
  | 'all_group_messages'
  | 'mentioned_members'
  | 'direct_messages_only'
  | 'disabled';

export const NOTIFICATION_POLICY_LABELS: Record<NotificationPolicy, string> = {
  all_group_messages: 'Todos os integrantes',
  mentioned_members: 'Apenas mencionados',
  direct_messages_only: 'Só conversas individuais',
  disabled: 'Desativado',
};

export const NOTIFICATION_POLICY_DESCRIPTIONS: Record<NotificationPolicy, string> = {
  all_group_messages: 'Todos os integrantes (exceto o remetente) recebem push de cada mensagem do grupo.',
  mentioned_members: 'Só quem for mencionado ou selecionado como destinatário recebe push.',
  direct_messages_only: 'Mensagens do grupo não geram push. Só conversas individuais notificam.',
  disabled: 'Nenhuma mensagem desta conversa gera push.',
};

export type DeviceRecord = {
  token: string;
  platform: string;
  enabled: boolean;
  updatedAt: number;
};
