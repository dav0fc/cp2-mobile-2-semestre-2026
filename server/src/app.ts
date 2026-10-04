import express from 'express';
import cors from 'cors';
import notificationsRouter from './routes/notifications';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check: permite verificar se a API esta no ar sem tocar no Firebase
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'frutigachat-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notificationsRouter);

  // Rota desconhecida
  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada.' });
  });

  return app;
}

// So sobe o servidor quando o arquivo e executado diretamente
// (os testes importam createApp sem abrir porta)
if (require.main === module) {
  const port = Number(process.env.PORT ?? 3001);
  createApp().listen(port, () => {
    console.log(`API do FrutigerChat rodando na porta ${port}`);
  });
}
