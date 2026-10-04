// O id da conversa individual e gerado a partir dos dois uids ordenados,
// assim o par (A, B) sempre cai no mesmo id, independente de quem inicia.
export function getDirectConversationId(uidA: string, uidB: string): string {
  const [first, second] = [uidA, uidB].sort();
  return `${first}_${second}`;
}

export function getOtherParticipant(conversationId: string, myUid: string): string {
  const parts = conversationId.split('_');
  return parts[0] === myUid ? parts[1] : parts[0];
}
