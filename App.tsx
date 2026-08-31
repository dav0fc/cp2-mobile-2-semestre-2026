import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProviderComponent } from './src/contexts/AuthContext';
import AppRouter from './src/navigation/AppRouter';

export default function App() {
  return (
    <AuthProviderComponent>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <AppRouter />
      </SafeAreaView>
    </AuthProviderComponent>
  );
}
