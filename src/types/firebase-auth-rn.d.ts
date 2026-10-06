// O build RN do @firebase/auth (campo "react-native" que o Metro usa em
// runtime) tem getReactNativePersistence, mas os tipos genericos que o TS
// resolve nao o expoem. Este shim restaura a tipagem do import usado em
// src/services/firebase.ts.
import type AsyncStorageDefault from '@react-native-async-storage/async-storage';

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: AsyncStorageDefault
  ): import('firebase/auth').Persistence;
}
