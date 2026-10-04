import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { ChatUser, RegisterData } from '../types/user';

function traduzirErroAuth(erro: unknown): string {
  const code = (erro as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido. Verifique o formato.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet.';
    default:
      return 'Não foi possível continuar. Tente novamente.';
  }
}

export async function loginUser(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (erro) {
    throw new Error(traduzirErroAuth(erro));
  }
}

export async function registerUser(data: RegisterData): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    // Mantem o nome no proprio Auth para o perfil ter uma boa fallback
    await updateProfile(credential.user, { displayName: data.name });
    const perfil: ChatUser = {
      uid: credential.user.uid,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      birthDate: data.birthDate,
      photoUrl: '',
      createdAt: Date.now(),
    };
    await setDoc(doc(firestore, 'users', credential.user.uid), perfil);
    return credential.user;
  } catch (erro) {
    if ((erro as { code?: string }).code?.startsWith('auth/')) {
      throw new Error(traduzirErroAuth(erro));
    }
    throw new Error('O cadastro foi criado, mas o perfil não foi salvo. Tente entrar novamente.');
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (erro) {
    throw new Error('Não foi possível sair da conta. Tente novamente.');
  }
}
