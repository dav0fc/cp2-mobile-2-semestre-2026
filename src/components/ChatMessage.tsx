import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../types/chat';

type ChatMessageItemProps = {
  message: ChatMessage;
  isOwn: boolean;
  showAuthor: boolean;
  authorName?: string;
  members?: { uid: string; name: string }[];
};

export default function ChatMessageItem({
  message,
  isOwn,
  showAuthor,
  authorName,
  members = [],
}: ChatMessageItemProps) {
  // Mensagem direcionada a um integrante ganha o rotulo "Para: nome"
  let targetLabel: string | null = null;
  if (message.target.type === 'member') {
    const memberId = message.target.memberId;
    const member = members.find((m) => m.uid === memberId);
    targetLabel = member ? `Para: ${member.name}` : 'Para um integrante';
  }

  return (
    <View style={[styles.container, isOwn ? styles.sent : styles.received]}>
      {showAuthor && !isOwn && authorName ? (
        <Text style={styles.author}>{authorName}</Text>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.sentBubble : styles.receivedBubble]}>
        {targetLabel ? <Text style={styles.targetLabel}>{targetLabel}</Text> : null}
        <Text style={[styles.text, isOwn ? styles.sentText : styles.receivedText]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isOwn ? styles.sentTime : styles.receivedTime]}>
          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    marginHorizontal: 12,
  },
  sent: {
    alignItems: 'flex-end',
  },
  received: {
    alignItems: 'flex-start',
  },
  author: {
    fontSize: 11,
    color: '#00838F',
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 6,
  },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sentBubble: {
    backgroundColor: '#00BCD4',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 4,
  },
  targetLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
    color: '#455A64',
  },
  text: {
    fontSize: 15,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#1A1A2E',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedTime: {
    color: '#78909C',
  },
});
