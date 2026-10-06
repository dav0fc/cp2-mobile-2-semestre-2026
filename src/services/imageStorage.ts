import { File } from 'expo-file-system';
import { IMGBB_KEY } from './firebase';

type ImgbbResponse = {
  success: boolean;
  status: number;
  data?: { url?: string };
  error?: { message?: string };
};

// Converte ArrayBuffer em base64 em blocos (evita estourar a pilha com fotos grandes)
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  const TAMANHO_BLOCO = 0x8000;
  for (let i = 0; i < bytes.length; i += TAMANHO_BLOCO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + TAMANHO_BLOCO));
  }
  return btoa(binario);
}

// Sobe a imagem para o imgbb e retorna a URL publica do arquivo.
// So a URL volta para o app; o arquivo fica no imgbb.
export async function uploadImage(fileUri: string, nome: string): Promise<string> {
  if (!IMGBB_KEY) {
    throw new Error('Chave do imgbb nao configurada (EXPO_PUBLIC_IMGBB_KEY no .env).');
  }

  // File do expo-file-system: o Blob do fetch do RN nao tem arrayBuffer
  const file = new File(fileUri);
  const base64 = bufferToBase64(await file.arrayBuffer());

  const corpo = new URLSearchParams();
  corpo.set('key', IMGBB_KEY);
  corpo.set('image', base64);
  corpo.set('name', nome);

  const envio = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: corpo.toString(),
  });
  const resultado = (await envio.json()) as ImgbbResponse;
  const url = resultado.data?.url;
  if (!envio.ok || !url) {
    throw new Error(resultado.error?.message ?? `imgbb respondeu com erro ${envio.status}.`);
  }
  return url;
}
