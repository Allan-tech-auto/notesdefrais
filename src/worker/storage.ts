import type { R2Bucket } from '@cloudflare/workers-types';

export interface UploadResult {
  key: string;
  size: number;
}

// Génère une clé unique pour le stockage
export function generateImageKey(userId: string, expenseId: string): string {
  const timestamp = Date.now();
  return `${userId}/${expenseId}_${timestamp}.jpg`;
}

// Upload une image vers R2
export async function uploadImage(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  await bucket.put(key, data, {
    httpMetadata: {
      contentType
    }
  });

  return {
    key,
    size: data.byteLength
  };
}

// Récupère une image depuis R2
export async function getImage(
  bucket: R2Bucket,
  key: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const object = await bucket.get(key);

  if (!object) {
    return null;
  }

  const data = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType || 'image/jpeg';

  return { data, contentType };
}

// Supprime une image de R2
export async function deleteImage(bucket: R2Bucket, key: string): Promise<boolean> {
  try {
    await bucket.delete(key);
    return true;
  } catch {
    return false;
  }
}

// Convertit un base64 data URL en ArrayBuffer
export function base64ToArrayBuffer(base64DataUrl: string): { data: ArrayBuffer; contentType: string } {
  // Format: data:image/jpeg;base64,/9j/4AAQ...
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches) {
    throw new Error('Invalid base64 data URL');
  }

  const contentType = matches[1];
  const base64 = matches[2];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    data: bytes.buffer,
    contentType
  };
}

// Convertit un ArrayBuffer en base64 data URL
export function arrayBufferToBase64(data: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}
