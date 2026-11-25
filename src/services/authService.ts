// src/services/authService.ts
// Registro y login LOCALES: la API de clase solo expone /tasks, así que las cuentas
// viven en el dispositivo (expo-secure-store). La contraseña se guarda con hash SHA-256.
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export type User = { name: string; email: string };
type StoredUser = User & { passwordHash: string };

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const USERS_KEY = 'auth_users';
const SESSION_KEY = 'auth_session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(email: string, password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${email}:${password}`);
}

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await SecureStore.getItemAsync(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) throw new AuthError('Ingresá tu nombre.');
  if (!EMAIL_REGEX.test(cleanEmail)) throw new AuthError('Ingresá un email válido.');
  if (password.length < 6) throw new AuthError('La contraseña debe tener al menos 6 caracteres.');

  const users = await readUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new AuthError('Ya existe una cuenta con ese email.');
  }

  const user: StoredUser = {
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(cleanEmail, password),
  };
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify([...users, user]));
  const session: User = { name: user.name, email: user.email };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login(email: string, password: string): Promise<User> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) throw new AuthError('Completá el email y la contraseña.');

  const users = await readUsers();
  const found = users.find((u) => u.email === cleanEmail);
  const hash = await hashPassword(cleanEmail, password);
  // Mismo mensaje para "no existe" y "contraseña mala": no revela qué emails están registrados.
  if (!found || found.passwordHash !== hash) throw new AuthError('Email o contraseña incorrectos.');

  const session: User = { name: found.name, email: found.email };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}