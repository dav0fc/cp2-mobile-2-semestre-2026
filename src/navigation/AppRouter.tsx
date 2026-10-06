import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { getInitialNotification } from '../services/notificationService';
import { fetchProfiles, getProfile } from '../services/userService';
import { getGroup } from '../services/groupService';
import { getOtherParticipant } from '../utils/conversationId';
import { ChatRouteData, ConversationType } from '../types/chat';
import { ChatGroup } from '../types/group';
import { ChatUser } from '../types/user';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import UsersScreen from '../screens/UsersScreen';
import GroupFormScreen from '../screens/GroupFormScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import Loading from '../components/Loading';

// Navegacao propria com uma pilha de rotas: simples e sem dependencia extra
type Route =
  | { name: 'conversations' }
  | { name: 'users'; mode: 'chat' | 'group'; initialSelectedIds?: string[] }
  | { name: 'group-form'; groupId?: string }
  | { name: 'chat'; conversation: ChatRouteData }
  | { name: 'profile'; uid: string }
  | { name: 'group-members'; groupId: string };

type AuthView = 'login' | 'register';

export default function AppRouter() {
  const { user, loading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [stack, setStack] = useState<Route[]>([{ name: 'conversations' }]);
  // selecao que volta da tela de usuarios para o formulario de grupo
  const [groupSelection, setGroupSelection] = useState<string[] | null>(null);

  const push = useCallback((route: Route) => setStack((previous) => [...previous, route]), []);
  const pop = useCallback(
    () => setStack((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous)),
    []
  );

  // A cada novo login a pilha recomeca do zero (nada de conversa "presa"
  // de sessao anterior)
  const hadUserRef = useRef(false);
  useEffect(() => {
    if (user && !hadUserRef.current) {
      hadUserRef.current = true;
      setStack([{ name: 'conversations' }]);
      setGroupSelection(null);
    }
    if (!user) hadUserRef.current = false;
  }, [user]);

  const openDirectChat = useCallback(
    async (conversationId: string, otherUid: string) => {
      let other = null;
      try {
        other = await getProfile(otherUid);
      } catch (erro) {
        console.error(erro);
      }
      push({
        name: 'chat',
        conversation: {
          conversationId,
          conversationType: 'direct',
          title: other?.name ?? 'Conversa',
          photoUrl: other?.photoUrl ?? '',
          otherUser: other,
          group: null,
          members: other ? [other] : [],
        },
      });
    },
    [push]
  );

  const openGroupChat = useCallback(
    async (group: ChatGroup) => {
      let members: ChatUser[] = [];
      try {
        members = await fetchProfiles(group.memberIds);
      } catch (erro) {
        console.error(erro);
      }
      push({
        name: 'chat',
        conversation: {
          conversationId: group.id,
          conversationType: 'group',
          title: group.name,
          photoUrl: group.photoUrl,
          otherUser: null,
          group,
          members,
        },
      });
    },
    [push]
  );

  // Toque na notificacao: o payload traz o id e o tipo da conversa
  const handleNotificationTap = useCallback(
    async ({ conversationId, conversationType }: { conversationId: string; conversationType: ConversationType }) => {
      if (!user) return;
      try {
        if (conversationType === 'group') {
          const group = await getGroup(conversationId);
          if (group) await openGroupChat(group);
        } else {
          const otherUid = getOtherParticipant(conversationId, user.uid);
          await openDirectChat(conversationId, otherUid);
        }
      } catch (erro) {
        console.error('Erro ao abrir conversa a partir da notificacao:', erro);
      }
    },
    [user, openDirectChat, openGroupChat]
  );

  const { permission } = useNotifications(user, handleNotificationTap);

  // Cold start via push: se o app foi aberto pelo toque na notificacao
  // (app estava fechado), abre a conversa assim que o login existir
  const launchTapConsumedRef = useRef(false);
  useEffect(() => {
    if (!user || launchTapConsumedRef.current) return;
    launchTapConsumedRef.current = true;
    const data = getInitialNotification();
    if (data) handleNotificationTap(data);
  }, [user, handleNotificationTap]);

  if (authLoading) return <Loading />;

  if (!user) {
    return authView === 'login' ? (
      <LoginScreen onGoRegister={() => setAuthView('register')} />
    ) : (
      <RegisterScreen onGoLogin={() => setAuthView('login')} />
    );
  }

  const current = stack[stack.length - 1];

  switch (current.name) {
    case 'conversations':
      return (
        <ConversationsScreen
          onOpenDirect={(conversationId, otherUid) => openDirectChat(conversationId, otherUid)}
          onOpenGroup={(group) => openGroupChat(group)}
          onNewChat={() => push({ name: 'users', mode: 'chat' })}
          onNewGroup={() => {
            setGroupSelection(null);
            push({ name: 'group-form' });
          }}
          notificationPermission={permission}
        />
      );

    case 'users':
      return (
        <UsersScreen
          mode={current.mode}
          initialSelectedIds={current.initialSelectedIds ?? []}
          onBack={pop}
          onOpenDirect={(conversationId) => {
            pop();
            openDirectChat(conversationId, getOtherParticipant(conversationId, user.uid));
          }}
          onConfirmSelection={(ids) => {
            setGroupSelection(ids);
            pop();
          }}
        />
      );

    case 'group-form':
      return (
        <GroupFormScreen
          groupId={current.groupId}
          onBack={pop}
          onGoSelectUsers={(initialSelectedIds) => {
            setGroupSelection(null);
            push({ name: 'users', mode: 'group', initialSelectedIds });
          }}
          selection={groupSelection}
          onSelectionConsumed={() => setGroupSelection(null)}
          onDone={(groupId) => {
            pop();
            getGroup(groupId).then((group) => {
              if (group) openGroupChat(group);
            });
          }}
        />
      );

    case 'chat':
      return (
        <ChatScreen
          conversation={current.conversation}
          onBack={pop}
          onOpenProfile={(uid) => push({ name: 'profile', uid })}
          onOpenGroupMembers={(groupId) => push({ name: 'group-members', groupId })}
        />
      );

    case 'profile':
      return <ProfileScreen uid={current.uid} onBack={pop} />;

    case 'group-members':
      return (
        <GroupMembersScreen
          groupId={current.groupId}
          onBack={pop}
          onOpenProfile={(uid) => push({ name: 'profile', uid })}
          onGoSelectUsers={(initialSelectedIds) => {
            setGroupSelection(null);
            push({ name: 'users', mode: 'group', initialSelectedIds });
          }}
          selection={groupSelection}
          onSelectionConsumed={() => setGroupSelection(null)}
          onEditGroup={(groupId) => push({ name: 'group-form', groupId })}
        />
      );
  }
}
