# FrutigerChat

## Descrição

Aplicativo de chat 1 para 1 em React Native com TypeScript, utilizando Firebase Authentication e Firebase Realtime Database. O app implementa autenticação por e-mail/senha, Google e Apple, com regras de compatibilidade entre provedores para controle de quem pode conversar com quem.

## Tecnologias Utilizadas

- **React Native** 0.76
- **Expo SDK** 54
- **TypeScript** 5.6
- **Firebase Authentication** (Email/Senha, Google, Apple)
- **Firebase Realtime Database**

## Integrantes

- Denise Senise - RM 556006
- Larissa Rodrigues Lapa - RM 554517
- Mateus Leme - RM 557803
- David Gabriel Gomes Fernandes - RM 556020
- Vinicius Augusto Neves Prestes - RM 559097

## Instruções para Execução

### Pré-requisitos

1. Node.js 18+ instalado
2. Expo CLI instalado globalmente (`npm install -g expo`)
3. Conta Firebase com Authentication e Realtime Database habilitados

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o aplicativo
npx expo start
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Habilite **Authentication** com os provedores:
   - Email/Senha
   - Google (configure o OAuth consent screen)
   - Apple (configure com ID de aplicativo)
3. Habilite o **Realtime Database**
4. Crie um arquivo `.env` na raiz do projeto com as credenciais:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Configuração de Regras de Segurança

No Firebase Realtime Database, configure as regras:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "conversations": {
      "$cid": {
        ".read": "auth != null && (root.child('conversations').child($cid).child('participants').child('0').val() === request.auth.uid || root.child('conversations').child($cid).child('participants').child('1').val() === request.auth.uid)",
        ".write": "auth != null && (newData.child('participants').child('0').val() === auth.uid || newData.child('participants').child('1').val() === auth.uid)",
        ".validate": "newData.hasChildren(['participants', 'createdAt']) && newData.child('participants').hasChildren(['0', '1']) && (newData.child('participants').child('0').val() === auth.uid || newData.child('participants').child('1').val() === auth.uid)"
      }
    },
    "messages": {
      "$cid": {
        "$mid": {
          ".read": "auth != null && (root.child('conversations').child($cid).child('participants').child('0').val() === request.auth.uid || root.child('conversations').child($cid).child('participants').child('1').val() === request.auth.uid)",
          ".write": "auth != null && newData.child('senderId').val() === auth.uid",
          ".validate": "newData.hasChildren(['senderId', 'receiverId', 'text', 'createdAt']) && newData.child('senderId').val() === auth.uid && newData.child('receiverId').val() !== newData.child('senderId').val() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 1000"
        }
      }
    }
  }
}
```

## Estrutura do Projeto

```
src/
  components/         # Componentes reutilizáveis
    ChatMessage.tsx    # Item de mensagem no chat
    ChatInput.tsx      # Input de mensagem
    UserItem.tsx       # Item de usuário na lista
    Loading.tsx        # Indicador de loading
    ErrorMessage.tsx   # Exibidor de erros
  contexts/           # React Contexts
    AuthContext.tsx    # Contexto de autenticação
  hooks/              # Custom hooks
    useAuth.ts         # Hook de autenticação
    useChat.ts         # Hook de chat
  screens/            # Telas
    LoginScreen.tsx    # Tela de login/registro
    UsersScreen.tsx    # Lista de contatos
    ChatScreen.tsx     # Tela de conversa
  services/           # Serviços Firebase
    firebase.ts        # Configuração Firebase
    authService.ts     # Operações de autenticação
    chatService.ts     # Operações de chat
    userService.ts     # Operações de usuários
  types/              # Tipos TypeScript
    user.ts            # Tipos de usuário
    chat.ts            # Tipos de chat
  utils/              # Utilitários
    chatRules.ts       # Regras de compatibilidade
App.tsx               # Componente principal
```

## Capturas de Tela

*(Adicione prints da aplicação aqui)*

## Funcionalidades

- ✅ Login com e-mail/senha
- ✅ Cadastro com e-mail/senha
- ✅ Login com Google
- ✅ Login com Apple
- ✅ Logout
- ✅ Regra de compatibilidade entre provedores
- ✅ Chat 1 para 1 exclusivamente
- ✅ Mensagens em tempo real (Realtime Database)
- ✅ Diferenciação visual entre mensagens enviadas e recebidas
- ✅ Loading e tratamento de erros
- ✅ 100% TypeScript sem `any`

## Regra de Comunicação

| Meu Provedor   | Posso conversar com       |
|---------------|---------------------------|
| E-mail/Senha  | Google, Apple             |
| Google        | E-mail/Senha              |
| Apple         | E-mail/Senha              |

Combinações **não permitidas**: E-mail vs E-mail, Google vs Apple, Google vs Google, Apple vs Apple.
