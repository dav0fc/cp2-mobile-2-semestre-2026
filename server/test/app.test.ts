import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { createApp } from '../src/app';

test('health check responde ok sem precisar de credenciais', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));

  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}/health`;
  const response = await fetch(url);
  const body = (await response.json()) as { status?: string };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');

  server.close();
});

test('rota desconhecida responde 404', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));

  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/nao-existe`);
  assert.equal(response.status, 404);

  server.close();
});

test('endpoint de notificacao exige token de autenticacao', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));

  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/notifications/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: 'abc', messageId: '123' }),
  });
  assert.equal(response.status, 401);

  server.close();
});
