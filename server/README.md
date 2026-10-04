# API de notificações — FrutigerChat

API pequena em Node.js + Express + TypeScript + Firebase Admin SDK, responsável
por enviar as notificações push do app. O app só pede (`conversationId` +
`messageId` + ID Token); a API é que valida tudo e decide quem recebe.

## Comandos

```bash
npm install
npm run dev        # desenvolvimento (tsx, porta 3001)
npm run build      # compila para dist/
npm start          # roda a versão compilada
npm test           # testes (node:test)
```

## Variáveis de ambiente

Veja o `.env.example`. As credenciais da conta de serviço do Firebase ficam
**apenas na hospedagem**, nunca no repositório.

## Endpoints

- `GET /health` — health check
- `POST /notifications/messages` — `{ conversationId, messageId }` com header
  `Authorization: Bearer <firebase-id-token>`
