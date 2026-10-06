import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { uploadImage } from './imageStorage';
import { ChatUser } from '../types/user';
import { parseUserDoc } from '../utils/parseData';

export async function getProfile(uid: string): Promise<ChatUser | null> {
  const snapshot = await getDoc(doc(firestore, 'users', uid));
  if (!snapshot.exists()) return null;
  return parseUserDoc(snapshot.id, snapshot.data());
}

export async function fetchProfiles(uids: string[]): Promise<ChatUser[]> {
  const results = await Promise.all(uids.map((uid) => getProfile(uid)));
  return results.filter((profile): profile is ChatUser => profile !== null);
}

export function listenToUsers(
  callback: (users: ChatUser[]) => void,
  onError?: (mensagem: string) => void
): () => void {
  return onSnapshot(
    collection(firestore, 'users'),
    (snapshot) => {
      const users = snapshot.docs
        .map((d) => parseUserDoc(d.id, d.data()))
        .filter((user): user is ChatUser => user !== null);
      callback(users);
    },
    () => onError?.('Não foi possível carregar a lista de usuários.')
  );
}

export async function saveUserProfile(profile: ChatUser): Promise<void> {
  await setDoc(doc(firestore, 'users', profile.uid), profile);
}

export async function updateProfilePhoto(uid: string, photoUrl: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), { photoUrl });
}

// Sobe a imagem para o imgbb e salva so a URL no Firestore
export async function uploadProfilePhoto(uid: string, fileUri: string): Promise<string> {
  const url = await uploadImage(fileUri, `perfil-${uid}`);
  await updateDoc(doc(firestore, 'users', uid), { photoUrl: url });
  return url;
}

export async function saveDevice(
  uid: string,
  deviceId: string,
  token: string,
  platform: string
): Promise<void> {
  await setDoc(doc(firestore, 'users', uid, 'devices', deviceId), {
    token,
    platform,
    enabled: true,
    updatedAt: Date.now(),
  });
}
