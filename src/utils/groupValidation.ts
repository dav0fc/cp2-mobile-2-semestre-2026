import { ChatGroup } from '../types/group';

export const MIN_GROUP_SIZE = 2;
export const MIN_MEMBER_LIMIT = 2;

export function isMemberLimitValid(limit: number): boolean {
  return Number.isInteger(limit) && limit >= MIN_MEMBER_LIMIT;
}

// Vagas livres do grupo (0 significa grupo cheio)
export function availableSlots(group: ChatGroup): number {
  return Math.max(0, group.memberLimit - group.memberIds.length);
}

export function canAddMember(group: ChatGroup, uid: string): boolean {
  if (group.memberIds.includes(uid)) return false;
  return availableSlots(group) > 0;
}

export function validateMemberLimitChange(currentGroup: ChatGroup, newLimit: number): string | null {
  if (!isMemberLimitValid(newLimit)) {
    return `O limite deve ser um número inteiro maior ou igual a ${MIN_MEMBER_LIMIT}.`;
  }
  if (newLimit < currentGroup.memberIds.length) {
    return `O limite não pode ser menor que o número de integrantes atuais (${currentGroup.memberIds.length}).`;
  }
  return null;
}

export function validateGroupName(name: string): string | null {
  if (name.trim().length < 3) return 'O nome do grupo precisa ter pelo menos 3 letras.';
  return null;
}

export function validateGroupMembers(memberIds: string[]): string | null {
  if (memberIds.length < MIN_GROUP_SIZE) {
    return `Um grupo precisa de pelo menos ${MIN_GROUP_SIZE} integrantes (incluindo você).`;
  }
  return null;
}

export function validateGroupForm(
  name: string,
  memberIds: string[],
  memberLimit: number
): string | null {
  const nameError = validateGroupName(name);
  if (nameError) return nameError;
  const membersError = validateGroupMembers(memberIds);
  if (membersError) return membersError;
  if (!isMemberLimitValid(memberLimit)) {
    return `O limite de integrantes deve ser um número inteiro maior ou igual a ${MIN_MEMBER_LIMIT}.`;
  }
  if (memberLimit < memberIds.length) {
    return `O limite de integrantes não pode ser menor que a quantidade selecionada (${memberIds.length}).`;
  }
  return null;
}
