import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import ChatMessageItem from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { ChatUser } from '../types/user';
import { ChatMessage } from '../types/chat';

type ChatScreenProps = {
  otherUser: ChatUser;
  onBack: () => void;
};

export default function ChatScreen({ otherUser, onBack }: ChatScreenProps) {
  const { user, logout } = useAuth();
  const myUserId = user?.uid ?? '';
  const { messages, sending, error, sendMessage, startConversation } = useChat(
    myUserId,
    user?.provider ?? 'password'
  );
  const [conversationStarted, setConversationStarted] = useState(false);

  const handleStartConversation = useCallback(async () => {
    try {
      await startConversation(otherUser);
      setConversationStarted(true);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
    }
  }, [otherUser, startConversation]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await sendMessage(text);
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      }
    },
    [sendMessage]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao realizar logout.');
    }
  }, [logout]);

  const isMyMessage = useCallback(
    (msg: ChatMessage): boolean => msg.senderId === user?.uid,
    [user?.uid]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatMessageItem message={item} isOwn={isMyMessage(item)} />
    ),
    [isMyMessage]
  );

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  if (!user) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.name}</Text>
          <Text style={styles.headerProvider}>{otherUser.provider}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {!conversationStarted ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatTitle}>
            Conversa com {otherUser.name}
          </Text>
          <Text style={styles.emptyChatSub}>
            Toque no botão abaixo para iniciar a conversa
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartConversation}
          >
            <Text style={styles.startButtonText}>Iniciar Conversa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
          {error && <ErrorMessage message={error} onDismiss={() => {}} />}
          <ChatInput onSend={handleSend} disabled={sending} />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 188, 212, 0.15)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#00BCD4',
    fontFamily: 'System',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#00838F',
  },
  headerProvider: {
    fontSize: 11,
    fontFamily: 'System',
    color: '#78909C',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.2)',
  },
  logoutText: {
    fontSize: 12,
    fontFamily: 'System',
    color: '#E53935',
    fontWeight: '600',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#00838F',
    marginBottom: 8,
  },
  emptyChatSub: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '600',
  },
  messageList: {
    paddingVertical: 8,
  },
});
