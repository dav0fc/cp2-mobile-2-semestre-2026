import admin from 'firebase-admin';

// Inicializacao lazy: so tenta configurar quando a API realmente precisa
// falar com o Firebase (o health check funciona sem credenciais)
let app: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Credenciais do Firebase Admin nao configuradas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // A chave privada pode vir com "\n" literais vindos da variavel de ambiente
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
  return app;
}
