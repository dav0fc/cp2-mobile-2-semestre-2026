import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../../firebaseConfig.json';

// A configuracao do SDK cliente fica no firebaseConfig.json versionado no repo
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// No RN o Auth fica so em memoria sem persistencia explicita — com o
// AsyncStorage a sessao sobrevive a fechamento do app (requisito do enunciado)
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // ja inicializado (recarregamento do bundler): usa a instancia existente
    return getAuth(app);
  }
})();
export const db = getDatabase(app);
export const firestore = getFirestore(app);

// URL publica da API da equipe (definida no .env do app)
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? '';
// Chave da conta imgbb para upload das fotos (definida no .env do app)
export const IMGBB_KEY: string = process.env.EXPO_PUBLIC_IMGBB_KEY ?? '';
