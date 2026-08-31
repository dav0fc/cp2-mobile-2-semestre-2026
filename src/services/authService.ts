import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null = null;

try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  // Native module not available (e.g., Expo Go)
}

const GOOGLE_WEB_CLIENT_ID: string | undefined =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type AuthResult = {
  user: User | null;
  error: string | null;
};

export async function signInWithEmailAndPasswordService(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const authInstance = getAuth();
    const credential = await signInWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return { user: credential.user, error: null };
  } catch (err) {
    const error = err as { code?: string; message?: string };
    return {
      user: null,
      error: error.message ?? 'Falha no login com e-mail',
    };
  }
}

export async function createUserWithEmailAndPasswordService(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const authInstance = getAuth();
    const credential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return { user: credential.user, error: null };
  } catch (err) {
    const error = err as { code?: string; message?: string };
    return {
      user: null,
      error: error.message ?? 'Falha no cadastro',
    };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!GoogleSignin) {
    return { user: null, error: 'Google Sign-In não disponível. Use um build nativo.' };
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    return {
      user: null,
      error:
        'Login com Google não configurado. Defina EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no arquivo .env (veja o passo a passo no README).',
    };
  }
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    const response = await GoogleSignin.signIn();
    const idToken = (response as { idToken?: string }).idToken;

    if (!idToken) {
      return { user: null, error: 'Google Sign-In: token não recebido' };
    }

    const authInstance = getAuth();
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(
      authInstance,
      googleCredential
    );
    return { user: credential.user, error: null };
  } catch (err) {
    const error = err as { code?: string; message?: string };
    return {
      user: null,
      error: error.message ?? 'Falha no login com Google',
    };
  }
}

export async function signInWithApple(): Promise<AuthResult> {
  try {
    if (Platform.OS === 'web') {
      return { user: null, error: 'Apple só está disponível em build nativo' };
    }
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return {
        user: null,
        error: 'Sign in with Apple não está disponível nesta plataforma.',
      };
    }

    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const nonce = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });

    const { identityToken, fullName, email } = appleCredential;
    if (!identityToken) {
      return { user: null, error: 'Apple Sign-In: token não recebido' };
    }

    const authInstance = getAuth();
    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });
    const credential = await signInWithCredential(
      authInstance,
      firebaseCredential
    );
    return { user: credential.user, error: null };
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { user: null, error: null };
    }
    return {
      user: null,
      error: error.message ?? 'Falha no login com Apple',
    };
  }
}

export async function signOutService(): Promise<void> {
  try {
    const authInstance = getAuth();
    await signOut(authInstance);
  } catch (err) {
    const error = err as { message?: string };
    throw new Error(error.message ?? 'Falha no logout');
  }
}
