import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type ErrorMessageProps = {
  message: string;
  onDismiss?: () => void;
};

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>Fechar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.3)',
  },
  text: {
    flex: 1,
    color: '#E53935',
    fontSize: 14,
    fontFamily: 'System',
  },
  dismiss: {
    color: '#E53935',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
  },
});
