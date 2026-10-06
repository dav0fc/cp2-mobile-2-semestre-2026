import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { uploadImage } from './imageStorage';
import { ChatGroup } from '../types/group';
import { NotificationPolicy } from '../types/notification';
import { parseGroupDoc } from '../utils/parseData';
import { availableSlots } from '../utils/groupValidation';

export type NewGroupData = {
  name: string;
  photoUrl: string;
  ownerId: string;
  memberIds: string[];
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
};

export async function createGroup(data: NewGroupData): Promise<string> {
  const agora = Date.now();
  const ref = await addDoc(collection(firestore, 'groups'), {
    ...data,
    createdAt: agora,
    updatedAt: agora,
  });
  return ref.id;
}

export async function getGroup(groupId: string): Promise<ChatGroup | null> {
  const snapshot = await getDoc(doc(firestore, 'groups', groupId));
  if (!snapshot.exists()) return null;
  return parseGroupDoc(snapshot.id, snapshot.data());
}

// So consulta os grupos onde o usuario e integrante: com a regra de
// leitura restrita a integrantes, uma query geral daria erro de permissao
export function listenToGroups(
  uid: string,
  callback: (groups: ChatGroup[]) => void,
  onError?: (mensagem: string) => void
): () => void {
  const q = query(collection(firestore, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const groups = snapshot.docs
        .map((d) => parseGroupDoc(d.id, d.data()))
        .filter((group): group is ChatGroup => group !== null);
      callback(groups);
    },
    () => onError?.('Não foi possível carregar os grupos.')
  );
}

// Escuta um grupo especifico. Se o usuario perder a integracao, a leitura
// volta erro de permissao e isso chega no onError.
export function listenToGroup(
  groupId: string,
  callback: (group: ChatGroup | null) => void,
  onError: (mensagem: string) => void
): () => void {
  return onSnapshot(
    doc(firestore, 'groups', groupId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(parseGroupDoc(snapshot.id, snapshot.data()));
    },
    () => onError('Você não tem mais acesso a este grupo.')
  );
}

// Adicao de integrante com transacao: le o grupo, checa a vaga e atualiza
// atomicamente. Se dois clientes tentarem ao mesmo tempo, um re-tenta
// apos o commit do outro e o limite nunca estoura.
export async function addGroupMember(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(firestore, 'groups', groupId);
  await runTransaction(firestore, async (tx) => {
    const snapshot = await tx.get(groupRef);
    if (!snapshot.exists()) throw new Error('Grupo não encontrado.');
    const group = parseGroupDoc(snapshot.id, snapshot.data());
    if (!group) throw new Error('Grupo inválido.');
    if (group.memberIds.includes(uid)) return; // já é integrante
    if (availableSlots(group) <= 0) {
      throw new Error('O grupo está cheio. Aumente o limite ou remova alguém antes de adicionar.');
    }
    tx.update(groupRef, {
      memberIds: arrayUnion(uid),
      updatedAt: Date.now(),
    });
  });
}

export async function removeGroupMember(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(firestore, 'groups', groupId), {
    memberIds: arrayRemove(uid),
    updatedAt: Date.now(),
  });
}

// A validacao "limite >= integrantes atuais" tambem existe nas regras do
// Firestore, mas a transacao da a mensagem de erro certa na interface.
export async function updateMemberLimit(groupId: string, newLimit: number): Promise<void> {
  const groupRef = doc(firestore, 'groups', groupId);
  await runTransaction(firestore, async (tx) => {
    const snapshot = await tx.get(groupRef);
    if (!snapshot.exists()) throw new Error('Grupo não encontrado.');
    const group = parseGroupDoc(snapshot.id, snapshot.data());
    if (!group) throw new Error('Grupo inválido.');
    if (newLimit < group.memberIds.length) {
      throw new Error(`O limite não pode ser menor que o número de integrantes atuais (${group.memberIds.length}).`);
    }
    tx.update(groupRef, { memberLimit: newLimit, updatedAt: Date.now() });
  });
}

export async function updateNotificationPolicy(
  groupId: string,
  policy: NotificationPolicy
): Promise<void> {
  await updateDoc(doc(firestore, 'groups', groupId), {
    notificationPolicy: policy,
    updatedAt: Date.now(),
  });
}

export type GroupFieldChanges = {
  name?: string;
  photoUrl?: string;
};

export async function updateGroupFields(groupId: string, changes: GroupFieldChanges): Promise<void> {
  await updateDoc(doc(firestore, 'groups', groupId), {
    ...changes,
    updatedAt: Date.now(),
  });
}

// Foto do grupo: sobe no imgbb e so a URL vai para o Firestore
export async function uploadGroupPhoto(groupId: string, fileUri: string): Promise<string> {
  const url = await uploadImage(fileUri, `grupo-${groupId}`);
  await updateDoc(doc(firestore, 'groups', groupId), { photoUrl: url, updatedAt: Date.now() });
  return url;
}
