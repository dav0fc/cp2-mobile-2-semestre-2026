import admin from 'firebase-admin';

// Inicializacao lazy: so tenta configurar quando a API realmente precisa
// falar com o Firebase (o health check funciona sem credenciais)
let app: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error('Credenciais do Firebase Admin nao configuradas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
  }

  // A chave pode vir com as quebras literais "\\n" (como no JSON da conta de
  // servico) e/ou aspas/espacos extras da colagem
  const privateKey = rawKey.trim().replace(/"/g, '').replace(/\\n/g, '\n').trim();
  if (!privateKey.includes('-----BEGIN')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY malformada: cole o valor de private_key do JSON da conta de servico em UMA linha, mantendo os \\n literais.'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return app;
}
