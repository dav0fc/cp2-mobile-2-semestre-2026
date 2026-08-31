import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatUser } from '../types/user';
import { getProviderLabel } from '../utils/chatRules';

type UserItemProps = {
  user: ChatUser;
  onPress: (user: ChatUser) => void;
};

export default function UserItem({ user, onPress }: UserItemProps) {
  const providerLabel = getProviderLabel(user.provider);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(user)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.provider}>{providerLabel}</Text>
        {user.email && (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00BCD4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '600',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#1A1A2E',
  },
  provider: {
    fontSize: 12,
    fontFamily: 'System',
    color: '#00BCD4',
    marginTop: 2,
  },
  email: {
    fontSize: 12,
    fontFamily: 'System',
    color: '#78909C',
    marginTop: 2,
  },
});
