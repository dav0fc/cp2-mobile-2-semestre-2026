import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ChatUser } from '../types/user';
import { UserRecord, AuthProvider } from '../types/user';
import { saveUser } from '../services/userService';

type AuthContextType = {
  user: ChatUser | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createUserWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const processFirebaseUser = useCallback(
    async (firebaseUserInstance: User | null) => {
      if (!firebaseUserInstance) {
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(firebaseUserInstance);

      const providerId = firebaseUserInstance.providerData[0]?.providerId ?? 'password';
      const providerMap: Record<string, string> = {
        'password': 'password',
        'google.com': 'google',
        'apple.com': 'apple',
      };
      const provider = providerMap[providerId] ?? 'password';

      const chatUser: ChatUser = {
        uid: firebaseUserInstance.uid,
        name: firebaseUserInstance.displayName ?? firebaseUserInstance.email ?? 'Usuário',
        email: firebaseUserInstance.email,
        provider: provider as 'password' | 'google' | 'apple',
      };

      setUser(chatUser);

      try {
        await saveUser(
          {
            name: chatUser.name,
            email: chatUser.email,
            provider: provider as AuthProvider,
          },
          chatUser.uid
        );
      } catch (err) {
        console.error('Error saving user:', err);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUserInstance) => {
      processFirebaseUser(firebaseUserInstance);
    });
    return unsubscribe;
  }, [processFirebaseUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { signInWithEmailAndPasswordService } = await import('../services/authService');
      const result = await signInWithEmailAndPasswordService(email, password);
      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }
    },
    []
  );

  const createUserWithEmail = useCallback(
    async (email: string, password: string) => {
      const { createUserWithEmailAndPasswordService } = await import('../services/authService');
      const result = await createUserWithEmailAndPasswordService(email, password);
      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const { signInWithGoogle: googleAuth } = await import('../services/authService');
    const result = await googleAuth();
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    const { signInWithApple: appleAuth } = await import('../services/authService');
    const result = await appleAuth();
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
  }, []);

  const logout = useCallback(async () => {
    const { signOutService } = await import('../services/authService');
    try {
      await signOutService();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    error,
    signInWithEmail,
    createUserWithEmail,
    signInWithGoogle,
    signInWithApple,
    logout,
    clearError,
  };
}

export function AuthProviderComponent({ children }: { children: ReactNode }) {
  const authContext = useProvideAuth();
  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
