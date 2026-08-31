import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../types/chat';

type ChatMessageItemProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export default function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  return (
    <View style={[styles.container, isOwn ? styles.sent : styles.received]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
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
    marginVertical: 4,
    marginHorizontal: 8,
    alignItems: 'flex-end',
  },
  sent: {
    alignItems: 'flex-end',
  },
  received: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: '#00BCD4',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: 'rgba(200, 230, 255, 0.9)',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    fontFamily: 'System',
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#1A1A2E',
  },
  time: {
    fontSize: 10,
    fontFamily: 'System',
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedTime: {
    color: '#78909C',
  },
});
