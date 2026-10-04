import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, View } from 'react-native';

type ChatInputProps = {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatInput({ onSend, disabled = false, placeholder = 'Digite uma mensagem...' }: ChatInputProps) {
  const [text, setText] = useState('');
  const podeEnviar = text.trim().length > 0 && !disabled;

  const handleSend = async () => {
    if (!podeEnviar) return;
    try {
      await onSend(text.trim());
      setText('');
    } catch {
      // se falhou, o texto fica no campo para o usuario tentar de novo
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, disabled && styles.disabled]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0, 188, 212, 0.5)"
          editable={!disabled}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !podeEnviar && styles.sendDisabled]}
          onPress={() => void handleSend()}
          disabled={!podeEnviar}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#00BCD4',
  },
  sendDisabled: {
    backgroundColor: 'rgba(0, 188, 212, 0.3)',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
