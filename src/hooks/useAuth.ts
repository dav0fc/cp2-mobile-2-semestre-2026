import { useAuthContext } from '../contexts/AuthContext';

// Hook de autenticação: acesso ao estado e ações do AuthContext
export function useAuth() {
  return useAuthContext();
}
