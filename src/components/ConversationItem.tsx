import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';

type ConversationItemProps = {
  kind: 'direct' | 'group';
  title: string;
  photoUrl: string;
  subtitle: string;
  onPress: () => void;
};

export default function ConversationItem({ kind, title, photoUrl, subtitle, onPress }: ConversationItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar photoUrl={photoUrl} name={title} size={52} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.badge, kind === 'group' ? styles.groupBadge : styles.directBadge]}>
        <Text style={styles.badgeText}>{kind === 'group' ? 'Grupo' : '1:1'}</Text>
      </View>
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
    borderColor: 'rgba(0, 188, 212, 0.15)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  groupBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
  },
  directBadge: {
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#455A64',
  },
});
