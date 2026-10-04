import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';
import { ChatUser } from '../types/user';

type GroupMemberItemProps = {
  user: ChatUser;
  isOwner: boolean;
  isSelf: boolean;
  onRemove?: () => void;
  onPress?: () => void;
};

export default function GroupMemberItem({ user, isOwner, isSelf, onRemove, onPress }: GroupMemberItemProps) {
  const canRemove = onRemove && !isOwner;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.main} onPress={onPress} disabled={!onPress}>
        <Avatar photoUrl={user.photoUrl} name={user.name} size={44} />
        <View style={styles.info}>
          <Text style={styles.name}>
            {user.name}
            {isSelf ? ' (você)' : ''}
          </Text>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Proprietário</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {canRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeText}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
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
    borderColor: 'rgba(0, 188, 212, 0.15)',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  ownerBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D6E00',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 87, 87, 0.12)',
  },
  removeText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '600',
  },
});
