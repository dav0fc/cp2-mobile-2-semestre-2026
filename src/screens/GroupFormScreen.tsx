import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import {
  addGroupMember,
  createGroup,
  getGroup,
  listenToGroup,
  removeGroupMember,
  updateGroupFields,
  updateMemberLimit,
  updateNotificationPolicy,
  uploadGroupPhoto,
} from '../services/groupService';
import {
  NotificationPolicy,
  NOTIFICATION_POLICY_DESCRIPTIONS,
  NOTIFICATION_POLICY_LABELS,
} from '../types/notification';
import {
  isMemberLimitValid,
  validateGroupForm,
  validateMemberLimitChange,
} from '../utils/groupValidation';
import Avatar from '../components/Avatar';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import { ChatUser } from '../types/user';
import { fetchProfiles } from '../services/userService';

type GroupFormScreenProps = {
  groupId?: string;
  onBack: () => void;
  onGoSelectUsers: (initialSelectedIds: string[]) => void;
  // selecao que volta da tela de usuarios
  selection: string[] | null;
  onSelectionConsumed: () => void;
  onDone: (groupId: string) => void;
};

const POLICY_ORDER: NotificationPolicy[] = [
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
];

export default function GroupFormScreen({
  groupId,
  onBack,
  onGoSelectUsers,
  selection,
  onSelectionConsumed,
  onDone,
}: GroupFormScreenProps) {
  const { user } = useAuth();
  const myUid = user?.uid ?? '';
  const isEdit = Boolean(groupId);

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [limitText, setLimitText] = useState('5');
  const [policy, setPolicy] = useState<NotificationPolicy>('all_group_messages');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Record<string, ChatUser>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [groupLoaded, setGroupLoaded] = useState(!isEdit);
  const [groupGone, setGroupGone] = useState(false);

  const memberIds = useMemo(
    () => (myUid ? [myUid, ...selectedIds] : [...selectedIds]),
    [myUid, selectedIds]
  );
  const memberIdsRef = useRef(memberIds);
  useEffect(() => {
    memberIdsRef.current = memberIds;
  }, [memberIds]);

  const limit = parseInt(limitText, 10);

  // No modo edicao, carrega o grupo e acompanha mudancas em tempo real
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = listenToGroup(
      groupId,
      (group) => {
        if (!group) {
          setGroupGone(true);
          return;
        }
        setGroupLoaded(true);
        // Preenche os campos so na primeira carga; depois o usuario manda
        setName((prev) => (prev === '' ? group.name : prev));
        setLimitText((prev) => (prev === '5' ? String(group.memberLimit) : prev));
        setPolicy((prev) => (prev === 'all_group_messages' ? group.notificationPolicy : prev));
        setCurrentPhotoUrl(group.photoUrl);
        setSelectedIds(group.memberIds.filter((uid) => uid !== myUid));
      },
      () => setGroupGone(true)
    );
    return unsubscribe;
  }, [groupId, myUid]);

  // Selecao que volta da tela de usuarios
  useEffect(() => {
    if (!selection) return;
    setSelectedIds(selection);
    onSelectionConsumed();

    // Na edicao, os novos integrantes precisam ser gravados no grupo.
    // A adicao vai por transacao, entao nao estoura o limite nem se
    // perder a entrada de outro dono agindo ao mesmo tempo.
    if (isEdit && groupId) {
      const current = new Set(memberIdsRef.current);
      const toAdd = selection.filter((uid) => !current.has(uid));
      for (const uid of toAdd) {
        addGroupMember(groupId, uid).catch((erro) => {
          console.error(erro);
          Alert.alert(
            'Erro ao adicionar integrante',
            erro instanceof Error ? erro.message : 'Tente novamente.'
          );
        });
      }
    }
  }, [selection, isEdit, groupId, onSelectionConsumed]);

  // Perfis dos integrantes selecionados (para mostrar nome/foto nos chips)
  const selectedKey = selectedIds.join(',');
  useEffect(() => {
    if (!selectedKey) {
      setSelectedProfiles({});
      return;
    }
    let ativo = true;
    fetchProfiles(selectedKey.split(',')).then((list) => {
      if (!ativo) return;
      const map: Record<string, ChatUser> = {};
      for (const profile of list) map[profile.uid] = profile;
      setSelectedProfiles(map);
    });
    return () => {
      ativo = false;
    };
  }, [selectedKey]);

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
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria de fotos.');
    }
  }, []);

  const handleRemoveMember = useCallback(
    async (uid: string) => {
      const profile = selectedProfiles[uid];
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Remover integrante',
          `Remover ${profile?.name ?? 'o integrante'} do grupo? Essa pessoa perde o acesso às mensagens.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmed || !groupId) return;
      try {
        await removeGroupMember(groupId, uid);
      } catch (erro) {
        console.error(erro);
        Alert.alert('Erro', 'Não foi possível remover o integrante.');
      }
    },
    [groupId, selectedProfiles]
  );

  const handleCreate = useCallback(async () => {
    if (loading) return;
    const validationError = validateGroupForm(name, memberIds, limit);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const id = await createGroup({
        name: name.trim(),
        photoUrl: '',
        ownerId: myUid,
        memberIds,
        memberLimit: limit,
        notificationPolicy: policy,
      });
      if (photoUri) {
        try {
          await uploadGroupPhoto(id, photoUri);
        } catch (fotoError) {
          console.error(fotoError);
          Alert.alert('Foto não enviada', 'O grupo foi criado, mas a foto não foi enviada.');
        }
      }
      onDone(id);
    } catch (erro) {
      console.error(erro);
      setError('Não foi possível criar o grupo. Verifique sua conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, [loading, name, memberIds, limit, policy, myUid, photoUri, onDone]);

  const handleSaveEdit = useCallback(async () => {
    if (loading || !groupId) return;
    const current = await getGroup(groupId);
    if (!current) {
      setError('O grupo não existe mais.');
      return;
    }

    const newName = name.trim();
    if (newName.length < 3) {
      setError('O nome do grupo precisa ter pelo menos 3 letras.');
      return;
    }
    const limitError = validateMemberLimitChange(current, limit);
    if (limitError) {
      setError(limitError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (photoUri) {
        await uploadGroupPhoto(groupId, photoUri);
      }
      if (newName !== current.name) {
        await updateGroupFields(groupId, { name: newName });
      }
      if (limit !== current.memberLimit) {
        await updateMemberLimit(groupId, limit);
      }
      if (policy !== current.notificationPolicy) {
        await updateNotificationPolicy(groupId, policy);
      }
      onBack();
    } catch (erro) {
      console.error(erro);
      setError(erro instanceof Error ? erro.message : 'Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  }, [loading, groupId, name, limit, policy, photoUri, onBack]);

  if (!myUid) return <Loading />;
  if (isEdit && !groupLoaded) return <Loading />;
  if (groupGone) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.centeredText}>Este grupo não existe mais ou você não tem acesso.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const slotsInfo = isMemberLimitValid(limit)
    ? `${memberIds.length}/${limit} vagas usadas · ${Math.max(0, limit - memberIds.length)} vaga(s) livre(s)`
    : 'Informe um limite válido (mínimo 2)';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Editar grupo' : 'Novo grupo'}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        <Text style={styles.label}>Nome do grupo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Turma de Sistemas"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity onPress={pickPhoto} style={styles.photoRow}>
          {photoUri || currentPhotoUrl ? (
            <Image
              source={{ uri: photoUri ?? currentPhotoUrl }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
          ) : (
            <Avatar photoUrl="" name={name || 'G'} size={56} />
          )}
          <Text style={styles.photoHint}>
            {photoUri || currentPhotoUrl ? 'Trocar foto do grupo' : 'Escolher foto (opcional)'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Máximo de integrantes</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5"
          value={limitText}
          onChangeText={setLimitText}
          keyboardType="number-pad"
        />
        <Text style={styles.slotsInfo}>{slotsInfo}</Text>

        <Text style={styles.label}>Integrantes</Text>
        <View style={styles.membersBox}>
          {selectedIds.length === 0 && (
            <Text style={styles.membersEmpty}>Nenhum integrante selecionado além de você.</Text>
          )}
          {selectedIds.map((uid) => {
            const profile = selectedProfiles[uid];
            return (
              <View key={uid} style={styles.memberChip}>
                <Avatar photoUrl={profile?.photoUrl ?? ''} name={profile?.name ?? '?'} size={28} />
                <Text style={styles.memberChipName}>{profile?.name ?? 'Carregando...'}</Text>
                {isEdit && (
                  <TouchableOpacity onPress={() => handleRemoveMember(uid)}>
                    <Text style={styles.memberChipRemove}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={styles.selectButton} onPress={() => onGoSelectUsers(selectedIds)}>
            <Text style={styles.selectButtonText}>
              {isEdit ? '+ Adicionar integrantes' : 'Selecionar integrantes'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Política de notificações</Text>
        <View style={styles.policyList}>
          {POLICY_ORDER.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.policyOption, policy === option && styles.policyOptionSelected]}
              onPress={() => setPolicy(option)}
            >
              <View style={[styles.radio, policy === option && styles.radioSelected]}>
                {policy === option && <View style={styles.radioDot} />}
              </View>
              <View style={styles.policyInfo}>
                <Text style={styles.policyLabel}>{NOTIFICATION_POLICY_LABELS[option]}</Text>
                <Text style={styles.policyDescription}>{NOTIFICATION_POLICY_DESCRIPTIONS[option]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={isEdit ? handleSaveEdit : handleCreate}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar grupo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  centeredText: {
    fontSize: 15,
    color: '#455A64',
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#00BCD4',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#00BCD4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00838F',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#455A64',
    marginTop: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  photoHint: {
    marginLeft: 12,
    color: '#00838F',
    fontSize: 13,
    fontWeight: '600',
  },
  slotsInfo: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 4,
  },
  membersBox: {
    backgroundColor: '#F7FEFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
    padding: 10,
  },
  membersEmpty: {
    fontSize: 13,
    color: '#90A4AE',
    marginBottom: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberChipName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  memberChipRemove: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  selectButton: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  selectButtonText: {
    color: '#00838F',
    fontWeight: '600',
    fontSize: 13,
  },
  policyList: {
    marginTop: 4,
  },
  policyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F7FEFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  policyOptionSelected: {
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderColor: '#00BCD4',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#00BCD4',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00BCD4',
  },
  policyInfo: {
    flex: 1,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  policyDescription: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
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
});
