import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatGroup } from '../types/group';
import {
  addGroupMember,
  listenToGroups,
  removeGroupMember,
  updateGroupFields,
  updateMemberLimit,
  updateNotificationPolicy,
} from '../services/groupService';
import { NotificationPolicy } from '../types/notification';

type UseGroupsResult = {
  myGroups: ChatGroup[];
  loading: boolean;
  error: string | null;
  addMember: (groupId: string, uid: string) => Promise<void>;
  removeMember: (groupId: string, uid: string) => Promise<void>;
  changeLimit: (groupId: string, newLimit: number) => Promise<void>;
  changePolicy: (groupId: string, policy: NotificationPolicy) => Promise<void>;
  saveFields: (groupId: string, changes: { name?: string; photoUrl?: string }) => Promise<void>;
  clearError: () => void;
};

export function useGroups(myUid: string): UseGroupsResult {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!myUid) return;
    const unsubscribe = listenToGroups(
      myUid,
      (allGroups) => {
        setGroups(allGroups);
        setLoading(false);
      },
      (mensagem) => {
        setError(mensagem);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [myUid]);

  // A query ja filtra por integracao, mas a checagem extra garante
  // que um grupo do qual eu fui removido some da lista em tempo real
  const myGroups = useMemo(
    () => groups.filter((group) => group.memberIds.includes(myUid)),
    [groups, myUid]
  );

  const clearError = useCallback(() => setError(null), []);

  const addMember = useCallback(
    async (groupId: string, uid: string) => {
      try {
        await addGroupMember(groupId, uid);
      } catch (erro) {
        console.error(erro);
        const mensagem = erro instanceof Error ? erro.message : 'Não foi possível adicionar o integrante.';
        setError(mensagem);
        throw erro;
      }
    },
    []
  );

  const removeMember = useCallback(
    async (groupId: string, uid: string) => {
      try {
        await removeGroupMember(groupId, uid);
      } catch (erro) {
        console.error(erro);
        throw new Error('Não foi possível remover o integrante.');
      }
    },
    []
  );

  const changeLimit = useCallback(
    async (groupId: string, newLimit: number) => {
      try {
        await updateMemberLimit(groupId, newLimit);
      } catch (erro) {
        console.error(erro);
        const mensagem = erro instanceof Error ? erro.message : 'Não foi possível alterar o limite.';
        setError(mensagem);
        throw erro;
      }
    },
    []
  );

  const changePolicy = useCallback(
    async (groupId: string, policy: NotificationPolicy) => {
      try {
        await updateNotificationPolicy(groupId, policy);
      } catch (erro) {
        console.error(erro);
        throw new Error('Não foi possível alterar a política de notificações.');
      }
    },
    []
  );

  const saveFields = useCallback(
    async (groupId: string, changes: { name?: string; photoUrl?: string }) => {
      try {
        await updateGroupFields(groupId, changes);
      } catch (erro) {
        console.error(erro);
        throw new Error('Não foi possível salvar as alterações do grupo.');
      }
    },
    []
  );

  return {
    myGroups,
    loading,
    error,
    addMember,
    removeMember,
    changeLimit,
    changePolicy,
    saveFields,
    clearError,
  };
}
