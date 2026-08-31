import { ref, set, onValue, off, get } from 'firebase/database';
import { ChatUser, UserRecord, AuthProvider } from '../types/user';
import { db } from './firebase';

export function saveUser(userData: UserRecord, uid: string): Promise<void> {
  const userPath = ref(db, `users/${uid}`);
  return set(userPath, userData);
}

export function getAllUsers(): Promise<ChatUser[]> {
  const usersRef = ref(db, 'users');
  return new Promise((resolve) => {
    get(usersRef)
      .then((snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          const users: ChatUser[] = Object.entries(data)
            .map(([uid, value]): ChatUser | null => {
              if (!value || typeof value !== 'object') return null;
              const record = value as Record<string, unknown>;
              if (!record.name) return null;
              return {
                uid,
                name: String(record.name),
                email: record.email ? String(record.email) : null,
                provider: String(record.provider) as AuthProvider,
              };
            })
            .filter((u): u is ChatUser => u !== null);
          resolve(users);
        } else {
          resolve([]);
        }
      })
      .catch(() => {
        resolve([]);
      });
  });
}

export function listenToAllUsers(
  callback: (users: ChatUser[]) => void
): () => void {
  const usersRef = ref(db, 'users');
  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const users: ChatUser[] = Object.entries(data)
          .map(([uid, value]): ChatUser | null => {
            if (!value || typeof value !== 'object') return null;
            const record = value as Record<string, unknown>;
            if (!record.name) return null;
            return {
              uid,
              name: String(record.name),
              email: record.email ? String(record.email) : null,
              provider: String(record.provider) as AuthProvider,
            };
          })
          .filter((u): u is ChatUser => u !== null);
        callback(users);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to users:', error);
    }
  );

  return () => off(usersRef);
}
