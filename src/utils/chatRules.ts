import { AuthProvider } from '../types/user';

export type CompatibleProviders = 'password' | 'google' | 'apple';

export function areProvidersCompatible(
  providerA: AuthProvider,
  providerB: AuthProvider
): boolean {
  if (providerA === providerB) {
    return false;
  }

  if (providerA === 'password' && providerB === 'password') {
    return false;
  }

  if ((providerA === 'google' && providerB === 'apple') ||
      (providerA === 'apple' && providerB === 'google')) {
    return false;
  }

  return true;
}

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
