import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import UserItem from '../components/UserItem';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { ChatUser } from '../types/user';
import { isProviderCompatibleWith } from '../utils/chatRules';
import { listenToAllUsers } from '../services/userService';

export default function UsersScreen({
  onUserSelected,
}: {
  onUserSelected: (user: ChatUser) => void;
}) {
  const { user, logout, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenToAllUsers((fetched) => {
      setUsers(fetched);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Falha ao realizar logout');
    }
  }, [logout]);

  const filteredUsers = useMemo(() => {
    if (!user) return [];
    return users.filter(
      (u) =>
        u.uid !== user.uid &&
        isProviderCompatibleWith(user.provider, u.provider)
    );
  }, [users, user]);

  const renderItem = useCallback(
    ({ item }: { item: ChatUser }) => (
      <UserItem
        user={item}
        onPress={() => onUserSelected(item)}
      />
    ),
    [onUserSelected]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum contato compatível encontrado.
        </Text>
        <Text style={styles.emptySubtext}>
          Apenas usuários com autenticação diferente podem conversar.
        </Text>
      </View>
    ),
    []
  );

  if (authLoading || loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contatos</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 188, 212, 0.15)',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#00838F',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.2)',
  },
  logoutText: {
    fontSize: 13,
    fontFamily: 'System',
    color: '#E53935',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#78909C',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'System',
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 8,
  },
});
