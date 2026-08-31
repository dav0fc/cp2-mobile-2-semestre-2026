import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = React.useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, disabled && styles.disabled]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="rgba(0, 188, 212, 0.5)"
          editable={!disabled}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || disabled) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Text style={[styles.sendText, (!text.trim() || disabled) && styles.sendTextDisabled]}>
            Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'System',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#00BCD4',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendDisabled: {
    backgroundColor: 'rgba(0, 188, 212, 0.3)',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  disabled: {
    opacity: 0.6,
  },
});
