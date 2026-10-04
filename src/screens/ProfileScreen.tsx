import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/userService';
import { getDirectConversation } from '../services/chatService';
import { listenToGroups } from '../services/groupService';
import { getDirectConversationId } from '../utils/conversationId';
import { ChatUser } from '../types/user';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';

type ProfileScreenProps = {
  uid: string;
  onBack: () => void;
};

type AccessState = 'loading' | 'allowed' | 'denied' | 'notfound';

export default function ProfileScreen({ uid, onBack }: ProfileScreenProps) {
  const { user } = useAuth();
  const myUid = user?.uid ?? '';
  const [profile, setProfile] = useState<ChatUser | null>(null);
  const [access, setAccess] = useState<AccessState>('loading');

  // So da ver o perfil quem compartilha conversa individual ou grupo
  useEffect(() => {
    if (!myUid) {
      setAccess('denied');
      return;
    }
    let ativo = true;
    let unsubscribeGroups: (() => void) | null = null;

    (async () => {
      const perfil = await getProfile(uid);
      if (!ativo) return;
      if (!perfil) {
        setAccess('notfound');
        return;
      }
      setProfile(perfil);

      // 1) existe conversa individual entre os dois?
      const directId = getDirectConversationId(myUid, uid);
      try {
        const direct = await getDirectConversation(directId);
        if (direct && ativo) {
          setAccess('allowed');
          return;
        }
      } catch {
        // sem permissao de leitura = nao somos participantes; segue adiante
      }

      // 2) algum dos meus grupos tambem tem essa pessoa?
      unsubscribeGroups = listenToGroups(
        myUid,
        (myGroups) => {
          if (!ativo) return;
          const compartilhado = myGroups.some((group) => group.memberIds.includes(uid));
          setAccess(compartilhado ? 'allowed' : 'denied');
          if (unsubscribeGroups) unsubscribeGroups();
        },
        () => {
          if (ativo) setAccess('denied');
        }
      );
    })();

    return () => {
      ativo = false;
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, [uid, myUid]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.backButton} />
      </View>

      {access === 'loading' && <Loading />}

      {access === 'denied' && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            Você não tem permissão para ver este perfil. É preciso compartilhar uma conversa com
            essa pessoa.
          </Text>
        </View>
      )}

      {access === 'notfound' && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>Usuário não encontrado.</Text>
        </View>
      )}

      {access === 'allowed' && profile && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.photoCircle}>
            <Avatar photoUrl={profile.photoUrl} name={profile.name} size={96} />
          </View>
          <Text style={styles.name}>{profile.name}</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>E-mail</Text>
              <Text style={styles.rowValue}>{profile.email || 'Não informado'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Celular</Text>
              <Text style={styles.rowValue}>{profile.phoneNumber || 'Não informado'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nascimento</Text>
              <Text style={styles.rowValue}>{profile.birthDate || 'Não informado'}</Text>
            </View>
          </View>
        </ScrollView>
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
  content: {
    alignItems: 'center',
    padding: 24,
  },
  photoCircle: {
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 20,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#F7FEFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#455A64',
  },
  rowValue: {
    fontSize: 14,
    color: '#1A1A2E',
    flexShrink: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    marginHorizontal: 16,
  },
  messageBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  messageText: {
    fontSize: 15,
    color: '#78909C',
    textAlign: 'center',
  },
});
