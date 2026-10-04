import { Request, Response, NextFunction } from 'express';
import { getAdminApp } from '../services/firebaseAdmin';

// Deixa o uid disponivel em todos os handlers depois do middleware
declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

// Valida o token do Firebase Authentication enviado no header
// Authorization: Bearer <id-token>
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticacao ausente.' });
    return;
  }
  const token = header.slice('Bearer '.length);

  getAdminApp()
    .auth()
    .verifyIdToken(token)
    .then((decoded) => {
      req.uid = decoded.uid;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
    });
}
