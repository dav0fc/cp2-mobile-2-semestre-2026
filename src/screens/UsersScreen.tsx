import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { listenToUsers } from '../services/userService';
import { findOrCreateDirectConversation } from '../services/chatService';
import { ChatUser } from '../types/user';
import UserItem from '../components/UserItem';
import Loading from '../components/Loading';

type UsersScreenProps = {
  mode: 'chat' | 'group';
  initialSelectedIds?: string[];
  onBack: () => void;
  onOpenDirect?: (conversationId: string) => void;
  onConfirmSelection?: (selectedIds: string[]) => void;
};

export default function UsersScreen({
  mode,
  initialSelectedIds = [],
  onBack,
  onOpenDirect,
  onConfirmSelection,
}: UsersScreenProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [starting, setStarting] = useState(false);

  const myUid = user?.uid ?? '';

  const handleUsersLoaded = useCallback((loaded: ChatUser[]) => {
    setUsers(loaded);
    setLoading(false);
  }, []);

  // listener unico: a lista muda em tempo real quando alguem se cadastra
  useEffect(() => {
    const unsubscribe = listenToUsers(handleUsersLoaded, (mensagem) =>
      console.error(mensagem)
    );
    return unsubscribe;
  }, [handleUsersLoaded]);

  const filteredUsers = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return users.filter((u) => {
      if (u.uid === myUid) return false;
      if (!termo) return true;
      return (
        u.name.toLowerCase().includes(termo) ||
        (u.email && u.email.toLowerCase().includes(termo))
      );
    });
  }, [users, search, myUid]);

  const startDirectChat = useCallback(
    async (target: ChatUser) => {
      if (!myUid || starting) return;
      if (target.uid === myUid) {
        Alert.alert('Atenção', 'Você não pode conversar consigo mesmo.');
        return;
      }
      setStarting(true);
      try {
        const conversationId = await findOrCreateDirectConversation(myUid, target.uid);
        onOpenDirect?.(conversationId);
      } catch (erro) {
        console.error(erro);
        Alert.alert('Erro', 'Não foi possível iniciar a conversa. Tente de novo.');
      } finally {
        setStarting(false);
      }
    },
    [myUid, starting, onOpenDirect]
  );

  const toggleSelection = useCallback(
    (target: ChatUser) => {
      setSelectedIds((previous) => {
        if (previous.includes(target.uid)) {
          return previous.filter((uid) => uid !== target.uid);
        }
        return [...previous, target.uid];
      });
    },
    []
  );

  const handleUserPress = useCallback(
    (target: ChatUser) => {
      if (mode === 'chat') {
        startDirectChat(target);
      } else {
        toggleSelection(target);
      }
    },
    [mode, startDirectChat, toggleSelection]
  );

  if (loading) return <Loading />;

  const titulo = mode === 'chat' ? 'Novo chat' : 'Selecionar integrantes';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{titulo}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou e-mail..."
          placeholderTextColor="rgba(0, 188, 212, 0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={handleUserPress}
            selected={mode === 'group' && selectedIds.includes(item.uid)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search.trim()
                ? 'Nenhum usuário encontrado para essa busca.'
                : 'Ainda não há outros usuários cadastrados.'}
            </Text>
          </View>
        }
      />

      {mode === 'group' && (
        <View style={styles.footer}>
          <Text style={styles.footerInfo}>
            {selectedIds.length} selecionado(s)
            {myUid && !selectedIds.includes(myUid) ? ' + você' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.confirmButton, selectedIds.length === 0 && styles.confirmDisabled]}
            onPress={() => onConfirmSelection?.(selectedIds)}
            disabled={selectedIds.length === 0}
          >
            <Text style={styles.confirmText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#00BCD4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00838F',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F5FEFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
  },
  listContent: {
    paddingBottom: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#78909C',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.15)',
  },
  footerInfo: {
    fontSize: 13,
    color: '#455A64',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
