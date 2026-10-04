import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firestore } from '../services/firebase';
import { ChatUser, RegisterData } from '../types/user';
import { loginUser, logoutUser, registerUser } from '../services/authService';
import { parseUserDoc } from '../utils/parseData';

type AuthContextValue = {
  user: ChatUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let docUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (docUnsubscribe) {
        docUnsubscribe();
        docUnsubscribe = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // O perfil completo fica no Firestore; enquanto nao chega,
      // o app ja sabe que ha sessao ativa
      docUnsubscribe = onSnapshot(
        doc(firestore, 'users', firebaseUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setUser(parseUserDoc(snapshot.id, snapshot.data()));
          } else {
            // Perfil ausente: pode ser o cadastro que esta gravando o
            // perfil neste exato momento, entao confere de novo antes de
            // gravar um perfil basico (senao o basico pode por em cima
            // dos dados do cadastro)
            const ref = doc(firestore, 'users', firebaseUser.uid);
            getDoc(ref)
              .then((snapshot) => {
                if (snapshot.exists()) {
                  setUser(parseUserDoc(snapshot.id, snapshot.data()));
                } else {
                  const perfil: ChatUser = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName ?? (firebaseUser.email ?? 'Usuário'),
                    email: firebaseUser.email ?? '',
                    phoneNumber: '',
                    birthDate: '',
                    photoUrl: '',
                    createdAt: Date.now(),
                  };
                  setUser(perfil);
                  setDoc(ref, perfil).catch(() => {});
                }
                setLoading(false);
              })
              .catch(() => {
                const perfil: ChatUser = {
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName ?? (firebaseUser.email ?? 'Usuário'),
                  email: firebaseUser.email ?? '',
                  phoneNumber: '',
                  birthDate: '',
                  photoUrl: '',
                  createdAt: Date.now(),
                };
                setUser(perfil);
                setLoading(false);
              });
            return;
          }
          setLoading(false);
        },
        () => {
          // Sem acesso ao documento (regras/rede): usa fallback do Auth
          const perfil: ChatUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName ?? (firebaseUser.email ?? 'Usuário'),
            email: firebaseUser.email ?? '',
            phoneNumber: '',
            birthDate: '',
            photoUrl: '',
            createdAt: Date.now(),
          };
          setUser(perfil);
          setLoading(false);
        }
      );
    });

    return () => {
      if (docUnsubscribe) docUnsubscribe();
      unsubscribeAuth();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await loginUser(email, password);
      // a sessao ativa faz o onAuthStateChanged popular o user
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Falha no login.';
      setError(mensagem);
      throw erro;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    try {
      await registerUser(data);
      // onAuthStateChanged cuida do resto (perfil ja salvo no registerUser)
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Falha no cadastro.';
      setError(mensagem);
      throw erro;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Falha ao sair.';
      setError(mensagem);
      throw erro;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
