import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { listenToGroup } from '../services/groupService';
import { ChatMessage, ChatRouteData, MessageTarget } from '../types/chat';
import ChatMessageItem from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Avatar from '../components/Avatar';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';

type ChatScreenProps = {
  conversation: ChatRouteData;
  onBack: () => void;
  onOpenProfile: (uid: string) => void;
  onOpenGroupMembers: (groupId: string) => void;
};

export default function ChatScreen({
  conversation,
  onBack,
  onOpenProfile,
  onOpenGroupMembers,
}: ChatScreenProps) {
  const { user } = useAuth();
  const myUid = user?.uid ?? '';

  const isGroup = conversation.conversationType === 'group';
  const { messages, loading, sending, error, sendMessage } = useChat({
    conversationId: conversation.conversationId,
    conversationType: conversation.conversationType,
    myUid,
  });

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  // Em grupo, acompanha o documento: se o usuario for removido, a leitura
  // passa a dar erro de permissao e a tela bloqueia o envio
  useEffect(() => {
    if (!isGroup) return;
    const unsubscribe = listenToGroup(
      conversation.conversationId,
      (group) => setRemoved(!group || !group.memberIds.includes(myUid)),
      () => setRemoved(true)
    );
    return unsubscribe;
  }, [isGroup, conversation.conversationId, myUid]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleHeaderPress = useCallback(() => {
    if (isGroup) {
      onOpenGroupMembers(conversation.conversationId);
    } else if (conversation.otherUser) {
      onOpenProfile(conversation.otherUser.uid);
    }
  }, [isGroup, conversation, onOpenGroupMembers, onOpenProfile]);

  const handleSend = useCallback(
    async (text: string) => {
      const target: MessageTarget =
        isGroup && selectedTarget
          ? { type: 'member', memberId: selectedTarget }
          : { type: 'conversation' };
      try {
        await sendMessage(text, target);
      } catch {
        // erro ja fica disponivel no useChat
      }
    },
    [isGroup, selectedTarget, sendMessage]
  );

  const isMyMessage = useCallback((senderId: string) => senderId === myUid, [myUid]);

  const authorName = useCallback(
    (senderId: string) => conversation.members.find((m) => m.uid === senderId)?.name,
    [conversation.members]
  );

  const memberChips = useMemo(
    () => conversation.members.filter((m) => m.uid !== myUid),
    [conversation.members, myUid]
  );

  const subtitle = isGroup
    ? `${conversation.group?.memberIds.length ?? 0} membros · limite ${conversation.group?.memberLimit ?? '-'}`
    : conversation.otherUser?.email || 'Conversa individual';

  if (!user) return <Loading />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={handleHeaderPress}>
          <Avatar photoUrl={conversation.photoUrl} name={conversation.title} size={40} />
          <View style={styles.headerTexts}>
            <Text style={styles.headerName} numberOfLines={1}>
              {conversation.title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {removed ? (
        <View style={styles.removedBox}>
          <Text style={styles.removedTitle}>Você saiu ou foi removido deste grupo</Text>
          <Text style={styles.removedText}>
            Não é possível ver ou enviar novas mensagens desta conversa.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessageItem
                message={item}
                isOwn={isMyMessage(item.senderId)}
                showAuthor={isGroup}
                authorName={authorName(item.senderId)}
                members={conversation.members}
              />
            )}
            contentContainerStyle={
              messages.length === 0 ? styles.emptyContent : styles.messageList
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <Loading size="small" />
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Nenhuma mensagem ainda.
                    {isGroup ? ' Mande a primeira mensagem do grupo!' : ' Diga oi!'}
                  </Text>
                </View>
              )
            }
          />

          {isGroup && memberChips.length > 0 && (
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Destinatário:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.targetChip, selectedTarget === null && styles.targetChipSelected]}
                  onPress={() => setSelectedTarget(null)}
                >
                  <Text
                    style={[styles.targetChipText, selectedTarget === null && styles.targetChipTextSelected]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                {memberChips.map((member) => (
                  <TouchableOpacity
                    key={member.uid}
                    style={[styles.targetChip, selectedTarget === member.uid && styles.targetChipSelected]}
                    onPress={() => setSelectedTarget(member.uid)}
                  >
                    <Text
                      style={[
                        styles.targetChipText,
                        selectedTarget === member.uid && styles.targetChipTextSelected,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {error && (
            <View style={styles.errorRow}>
              <ErrorMessage message={error} onDismiss={() => {}} />
            </View>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={sending || removed}
            placeholder={
              isGroup && selectedTarget
                ? `Mensagem para ${memberChips.find((m) => m.uid === selectedTarget)?.name ?? 'o integrante'}...`
                : 'Digite uma mensagem...'
            }
          />
        </>
      )}
    </KeyboardAvoidingView>
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#00BCD4',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTexts: {
    marginLeft: 10,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00838F',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 1,
  },
  messageList: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#78909C',
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 188, 212, 0.05)',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.1)',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#455A64',
    marginRight: 8,
  },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
    marginRight: 6,
  },
  targetChipSelected: {
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    borderColor: '#00BCD4',
  },
  targetChipText: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '500',
  },
  targetChipTextSelected: {
    color: '#00838F',
    fontWeight: '700',
  },
  errorRow: {
    paddingHorizontal: 8,
    maxHeight: 60,
  },
  removedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  removedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 8,
  },
  removedText: {
    fontSize: 14,
    color: '#78909C',
    textAlign: 'center',
  },
});
