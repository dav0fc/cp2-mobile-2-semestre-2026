import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

type LoadingProps = {
  size?: 'small' | 'large';
  color?: string;
};

export default function Loading({ size = 'large', color = '#00BCD4' }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
