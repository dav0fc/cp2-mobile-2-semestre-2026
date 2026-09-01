# FrutigerChat

## Descrição

Aplicativo de chat 1 para 1 em React Native com TypeScript, utilizando Firebase Authentication e Firebase Realtime Database. O app implementa autenticação por e-mail/senha, Google e Apple, com regras de compatibilidade entre provedores para controle de quem pode conversar com quem.

## Tecnologias Utilizadas

- **React Native** 0.81.5
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

```bash
npm install
npx expo start
```

## Configuração do Firebase

1. Crie um projeto no Firebase Console
2. Habilite Authentication com os provedores: Email/Senha, Google e Apple
3. Habilite o Realtime Database
4. Crie um arquivo `.env` na raiz do projeto com suas credenciais

## Regras de Segurança

As regras de segurança estão em `database.rules.json`. Apenas usuários autenticados e participantes da conversa têm acesso aos dados.

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
    useChat.ts         # Hook de chat
  navigation/
    AppRouter.tsx      # Roteamento da aplicação
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
