import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

type FormMode = 'login' | 'register';

export default function LoginScreen() {
  const {
    signInWithEmail,
    createUserWithEmail,
    signInWithGoogle,
    signInWithApple,
    loading,
    error,
    clearError,
  } = useAuth();

  const [formMode, setFormMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLogin = formMode === 'login';

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;

    try {
      if (isLogin) {
        await signInWithEmail(email.trim(), password);
      } else {
        await createUserWithEmail(email.trim(), password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  }, [email, password, isLogin, signInWithEmail, createUserWithEmail]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google auth error:', err);
    }
  }, [signInWithGoogle]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      await signInWithApple();
    } catch (err) {
      console.error('Apple auth error:', err);
    }
  }, [signInWithApple]);

  const toggleFormMode = useCallback(() => {
    setFormMode((prev) => (prev === 'login' ? 'register' : 'login'));
    clearError();
  }, [clearError]);

  const title = isLogin ? 'Entrar' : 'Criar Conta';
  const submitLabel = isLogin ? 'Entrar' : 'Cadastrar';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>FrutigerChat</Text>
          <Text style={styles.subtitle}>Converse com seus contatos</Text>
        </View>

        <View style={styles.formCard}>
          {error && <ErrorMessage message={error} onDismiss={clearError} />}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="rgba(0, 188, 212, 0.4)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="rgba(0, 188, 212, 0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>{submitLabel}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Continuar com Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Continuar com Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleFormMode}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#00838F',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#78909C',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.15)',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'System',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  submitButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 188, 212, 0.2)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontFamily: 'System',
    color: '#78909C',
  },
  socialButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  appleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
  },
  toggleButton: {
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'System',
    color: '#00BCD4',
    fontWeight: '500',
  },
});
