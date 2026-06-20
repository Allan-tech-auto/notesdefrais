import { SignJWT, jwtVerify } from 'jose';
import type { Context } from 'hono';

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  display_name: string;
  iat: number;
  exp: number;
}

// Génère un hash de mot de passe simple (PBKDF2-like avec crypto.subtle)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return btoa(String.fromCharCode(...combined));
}

// Vérifie un mot de passe contre son hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const storedHashBytes = combined.slice(16);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);

  if (hashArray.length !== storedHashBytes.length) return false;
  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== storedHashBytes[i]) return false;
  }
  return true;
}

// Génère un token JWT
export async function generateToken(user: User, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    display_name: user.display_name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

// Vérifie et décode un token JWT
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Middleware pour extraire l'utilisateur du token
export async function getUserFromRequest(c: Context, secret: string): Promise<JWTPayload | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return verifyToken(token, secret);
}

// Génère un ID unique
export function generateId(): string {
  return crypto.randomUUID();
}
