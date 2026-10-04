import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { fetchProfiles } from '../services/userService';
import { listenToMyDirectConversations } from '../services/chatService';
import { ChatGroup } from '../types/group';
import { ChatUser } from '../types/user';
import { PermissionStatus } from '../services/notificationService';
import ConversationItem from '../components/ConversationItem';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

type ConversationsScreenProps = {
  onOpenDirect: (conversationId: string, otherUid: string) => void;
  onOpenGroup: (group: ChatGroup) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  notificationPermission: PermissionStatus | 'loading' | 'none';
};

type ListItem =
  | { kind: 'direct'; conversationId: string; otherUid: string; profile: ChatUser | null }
  | { kind: 'group'; group: ChatGroup };

export default function ConversationsScreen({
  onOpenDirect,
  onOpenGroup,
  onNewChat,
  onNewGroup,
  notificationPermission,
}: ConversationsScreenProps) {
  const { user, logout } = useAuth();
  const { myGroups, loading: groupsLoading, error: groupsError, clearError } = useGroups(user?.uid ?? '');
  const [directConversations, setDirectConversations] = useState<{ id: string; participants: string[] }[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ChatUser>>({});
  const [loading, setLoading] = useState(true);

  const myUid = user?.uid ?? '';

  useEffect(() => {
    if (!myUid) return;
    const unsubscribe = listenToMyDirectConversations(
      myUid,
      (conversations) => {
        setDirectConversations(conversations);
        setLoading(false);
      },
      (mensagem) => {
        console.error(mensagem);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [myUid]);

  const otherUids = useMemo(() => {
    const uids: string[] = [];
    for (const conversation of directConversations) {
      const other = conversation.participants.find((p) => p !== myUid);
      if (other) uids.push(other);
    }
    return uids;
  }, [directConversations, myUid]);

  const otherUidsKey = otherUids.join(',');

  useEffect(() => {
    if (!otherUidsKey) return;
    let ativo = true;
    const uids = otherUidsKey.split(',');
    fetchProfiles(uids).then((list) => {
      if (!ativo) return;
      const map: Record<string, ChatUser> = {};
      for (const profile of list) map[profile.uid] = profile;
      setProfiles(map);
    });
    return () => {
      ativo = false;
    };
  }, [otherUidsKey]);

  const items = useMemo<ListItem[]>(() => {
    const directItems: ListItem[] = directConversations.map((conversation) => {
      const otherUid = conversation.participants.find((p) => p !== myUid) ?? conversation.participants[0];
      return { kind: 'direct', conversationId: conversation.id, otherUid, profile: profiles[otherUid] ?? null };
    });
    const groupItems: ListItem[] = myGroups.map((group) => ({ kind: 'group', group }));
    return [...directItems, ...groupItems];
  }, [directConversations, profiles, myGroups, myUid]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (erro) {
      Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao sair.');
    }
  }, [logout]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'direct') {
        const profile = item.profile;
        return (
          <ConversationItem
            kind="direct"
            title={profile?.name ?? 'Conversa'}
            photoUrl={profile?.photoUrl ?? ''}
            subtitle={profile?.email || 'Conversa individual'}
            onPress={() => onOpenDirect(item.conversationId, item.otherUid)}
          />
        );
      }
      return (
        <ConversationItem
          kind="group"
          title={item.group.name}
          photoUrl={item.group.photoUrl}
          subtitle={`${item.group.memberIds.length}/${item.group.memberLimit} integrantes`}
          onPress={() => onOpenGroup(item.group)}
        />
      );
    },
    [onOpenDirect, onOpenGroup]
  );

  if (!user) return <Loading />;
  if (loading || groupsLoading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onNewChat}>
          <Text style={styles.actionText}>+ Novo chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onNewGroup}>
          <Text style={styles.actionText}>+ Novo grupo</Text>
        </TouchableOpacity>
      </View>

      {notificationPermission === 'denied' && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Notificações desativadas no sistema: você não receberá push de mensagens novas.
          </Text>
        </View>
      )}

      {groupsError && (
        <ErrorMessage message={groupsError} onDismiss={clearError} />
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => (item.kind === 'direct' ? item.conversationId : `group_${item.group.id}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyText}>
              Toque em "Novo chat" para conversar com alguém ou em "Novo grupo" para criar um grupo.
            </Text>
          </View>
        }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00838F',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.2)',
  },
  logoutText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
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
  actionText: {
    color: '#00838F',
    fontWeight: '600',
    fontSize: 14,
  },
  permissionBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  permissionText: {
    fontSize: 12,
    color: '#8D6E00',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#78909C',
    textAlign: 'center',
  },
});
