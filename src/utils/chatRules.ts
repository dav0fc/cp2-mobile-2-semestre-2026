import { AuthProvider } from '../types/user';

export function isProviderCompatibleWith(
  myProvider: AuthProvider,
  otherProvider: AuthProvider
): boolean {
  if (myProvider === 'password') {
    return otherProvider === 'google' || otherProvider === 'apple';
  }

  return otherProvider === 'password';
}

export function getProviderLabel(provider: AuthProvider): string {
  switch (provider) {
    case 'password':
      return 'E-mail';
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
  }
}
