import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import ErrorMessage from '../components/ErrorMessage';

type LoginScreenProps = {
  onGoRegister: () => void;
};

export default function LoginScreen({ onGoRegister }: LoginScreenProps) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (!email.trim() || !password) return;
    setLoading(true);
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // o erro ja fica disponivel no context
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, login, clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>FrutigerChat</Text>
          <Text style={styles.subtitle}>Converse individualmente e em grupos</Text>
        </View>

        <View style={styles.formCard}>
          {error && <ErrorMessage message={error} onDismiss={clearError} />}

          <Text style={styles.fieldLabel}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="rgba(0, 188, 212, 0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.fieldLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor="rgba(0, 188, 212, 0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading || !email.trim() || !password}
          >
            <Text style={styles.submitText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={onGoRegister} disabled={loading}>
            <Text style={styles.toggleText}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 30,
    fontWeight: '700',
    color: '#00838F',
  },
  subtitle: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#F7FEFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.15)',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
  },
  submitButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 12,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#00838F',
    fontWeight: '600',
  },
});
