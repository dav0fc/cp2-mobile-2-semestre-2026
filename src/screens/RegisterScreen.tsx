import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { uploadProfilePhoto } from '../services/userService';
import { auth } from '../services/firebase';
import Avatar from '../components/Avatar';
import ErrorMessage from '../components/ErrorMessage';

type RegisterScreenProps = {
  onGoLogin: () => void;
};

function validarDataNascimento(valor: string): string | null {
  if (valor.trim() === '') return 'Informe a data de nascimento (dd/mm/aaaa).';
  const match = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 'Data de nascimento inválida. Use o formato dd/mm/aaaa.';
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return 'Data de nascimento inválida.';
  }
  if (data.getTime() >= Date.now()) return 'A data de nascimento precisa ser no passado.';
  return null;
}

export default function RegisterScreen({ onGoLogin }: RegisterScreenProps) {
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset) setPhotoUri(asset.uri);
    } catch (erro) {
      console.error(erro);
      Alert.alert('Erro', 'Não foi possível abrir a galeria de fotos.');
    }
  }, []);

  const validarCampos = useCallback((): string | null => {
    if (name.trim().length < 3) return 'Informe seu nome completo (mínimo 3 letras).';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (confirm !== password) return 'A confirmação da senha não confere.';
    if (phone.replace(/\D/g, '').length < 8) return 'Informe um número de celular válido.';
    const dataError = validarDataNascimento(birthDate);
    if (dataError) return dataError;
    return null;
  }, [name, email, password, confirm, phone, birthDate]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    const validationError = validarCampos();
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);
    setLoading(true);
    clearError();
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: phone.trim(),
        birthDate: birthDate.trim(),
        photoFileUri: photoUri,
      });

      // Se o usuario escolheu foto, sobe apos a conta existir (o id so existe depois)
      const uid = auth.currentUser?.uid ?? '';
      if (photoUri && uid) {
        try {
          await uploadProfilePhoto(uid, photoUri);
        } catch (fotoError) {
          console.error('Falha ao enviar a foto:', fotoError);
          Alert.alert(
            'Foto não enviada',
            'Sua conta foi criada, mas a foto de perfil não foi enviada. Você pode tentar novamente depois.'
          );
        }
      }
    } catch (erro) {
      console.error(erro);
      // erro ja veio no context
    } finally {
      setLoading(false);
    }
  }, [loading, validarCampos, register, name, email, password, phone, birthDate, photoUri, clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados para entrar no FrutigerChat</Text>
        </View>

        <View style={styles.formCard}>
          {error && <ErrorMessage message={error} onDismiss={clearError} />}
          {fieldError && <ErrorMessage message={fieldError} onDismiss={() => setFieldError(null)} />}

          <TouchableOpacity onPress={pickPhoto} disabled={loading}>
            <View style={styles.photoWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <Avatar photoUrl="" name={name} size={72} />
              )}
              <View style={styles.photoButton}>
                <Text style={styles.photoButtonText}>{photoUri ? 'Trocar foto' : 'Escolher foto'}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>A foto é opcional, mas ajuda a identificar você nas conversas.</Text>

          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.fieldLabel}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.fieldLabel}>Número de celular</Text>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.fieldLabel}>Data de nascimento</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/aaaa"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? 'Criando conta...' : 'Cadastrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={onGoLogin} disabled={loading}>
            <Text style={styles.toggleText}>Já tem conta? Entrar</Text>
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
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
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
  photoWrapper: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  photoButton: {
    marginTop: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
  },
  photoButtonText: {
    color: '#00838F',
    fontSize: 12,
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: '#90A4AE',
    textAlign: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
