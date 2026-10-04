import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { addGroupMember, listenToGroup, removeGroupMember } from '../services/groupService';
import { fetchProfiles } from '../services/userService';
import { availableSlots } from '../utils/groupValidation';
import { ChatGroup } from '../types/group';
import { ChatUser } from '../types/user';
import GroupMemberItem from '../components/GroupMemberItem';
import Loading from '../components/Loading';

type GroupMembersScreenProps = {
  groupId: string;
  onBack: () => void;
  onOpenProfile: (uid: string) => void;
  onGoSelectUsers: (initialSelectedIds: string[]) => void;
  selection: string[] | null;
  onSelectionConsumed: () => void;
  onEditGroup: (groupId: string) => void;
};

export default function GroupMembersScreen({
  groupId,
  onBack,
  onOpenProfile,
  onGoSelectUsers,
  selection,
  onSelectionConsumed,
  onEditGroup,
}: GroupMembersScreenProps) {
  const { user } = useAuth();
  const myUid = user?.uid ?? '';
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [members, setMembers] = useState<Record<string, ChatUser>>({});
  const [loading, setLoading] = useState(true);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToGroup(
      groupId,
      (g) => {
        setGroup(g);
        setLoading(false);
        if (g && myUid && !g.memberIds.includes(myUid)) setRemoved(true);
      },
      () => {
        setRemoved(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [groupId, myUid]);

  const memberIdsRef = useRef<string[]>([]);
  useEffect(() => {
    memberIdsRef.current = group?.memberIds ?? [];
  }, [group]);

  // Integrantes confirmados na tela de usuarios: adiciona so os novos
  useEffect(() => {
    if (!selection) return;
    onSelectionConsumed();
    const current = new Set(memberIdsRef.current);
    const toAdd = selection.filter((uid) => !current.has(uid));
    for (const uid of toAdd) {
      addGroupMember(groupId, uid).catch((erro) => {
        console.error(erro);
        Alert.alert(
          'Erro ao adicionar integrante',
          erro instanceof Error ? erro.message : 'Tente novamente.'
        );
      });
    }
  }, [selection, groupId, onSelectionConsumed]);

  const memberKey = group ? group.memberIds.join(',') : '';
  useEffect(() => {
    if (!memberKey) return;
    let ativo = true;
    fetchProfiles(memberKey.split(',')).then((list) => {
      if (!ativo) return;
      const map: Record<string, ChatUser> = {};
      for (const profile of list) map[profile.uid] = profile;
      setMembers(map);
    });
    return () => {
      ativo = false;
    };
  }, [memberKey]);

  const isOwner = group?.ownerId === myUid;
  const slots = group ? availableSlots(group) : 0;

  const handleRemove = useCallback(
    async (uid: string) => {
      if (!group) return;
      const profile = members[uid];
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Remover integrante',
          `Remover ${profile?.name ?? 'o integrante'} do grupo? Essa pessoa perde o acesso às mensagens.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmed) return;
      try {
        await removeGroupMember(groupId, uid);
      } catch (erro) {
        console.error(erro);
        Alert.alert('Erro', 'Não foi possível remover o integrante.');
      }
    },
    [group, members, groupId]
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const profile = members[item];
      if (!profile) {
        return (
          <View style={styles.loadingItem}>
            <Loading size="small" />
          </View>
        );
      }
      return (
        <GroupMemberItem
          user={profile}
          isOwner={item === group?.ownerId}
          isSelf={item === myUid}
          onRemove={isOwner ? () => handleRemove(item) : undefined}
          onPress={() => onOpenProfile(item)}
        />
      );
    },
    [members, group, myUid, isOwner, handleRemove, onOpenProfile]
  );

  if (loading || !group) {
    return removed ? (
      <View style={styles.container}>
        <View style={styles.removedBox}>
          <Text style={styles.removedText}>Você não tem mais acesso a este grupo.</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <Loading />
    );
  }

  const memberIds = group.memberIds;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>
            {group.memberIds.length} de {group.memberLimit} vagas usadas
          </Text>
        </View>
        <View style={styles.headerBack} />
      </View>

      {isOwner && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, slots === 0 && styles.actionDisabled]}
            onPress={() => onGoSelectUsers(memberIds.filter((uid) => uid !== myUid))}
            disabled={slots === 0}
          >
            <Text style={styles.actionText}>
              {slots === 0 ? 'Sem vagas livres' : '+ Adicionar integrante'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEditGroup(group.id)}>
            <Text style={styles.actionText}>Editar grupo</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={memberIds}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBack: {
    padding: 8,
  },
  headerBackText: {
    fontSize: 24,
    color: '#00BCD4',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00838F',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#00838F',
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingItem: {
    padding: 12,
    marginHorizontal: 12,
  },
  removedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  removedText: {
    fontSize: 15,
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
