import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import UsersScreen from '../screens/UsersScreen';
import ChatScreen from '../screens/ChatScreen';
import Loading from '../components/Loading';
import { ChatUser } from '../types/user';

type Screen = 'login' | 'users' | 'chat';

export default function AppRouter() {
  const { user, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('users');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  useEffect(() => {
    if (!user) {
      setScreen('login');
      setSelectedUser(null);
    } else if (screen === 'login') {
      setScreen('users');
    }
  }, [user, screen]);

  const handleUserSelected = useCallback((chatUser: ChatUser) => {
    setSelectedUser(chatUser);
    setScreen('chat');
  }, []);

  const handleBackFromChat = useCallback(() => {
    setSelectedUser(null);
    setScreen('users');
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (screen === 'chat' && selectedUser) {
    return (
      <ChatScreen otherUser={selectedUser} onBack={handleBackFromChat} />
    );
  }

  return <UsersScreen onUserSelected={handleUserSelected} />;
}
