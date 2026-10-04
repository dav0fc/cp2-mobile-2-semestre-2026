import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';
import { ChatUser } from '../types/user';

type UserItemProps = {
  user: ChatUser;
  onPress: (user: ChatUser) => void;
  selected?: boolean;
};

export default function UserItem({ user, onPress, selected = false }: UserItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(user)}>
      <Avatar photoUrl={user.photoUrl} name={user.name} size={48} />
      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        {user.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
      </View>
      {selected && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  email: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  selectedBadge: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
