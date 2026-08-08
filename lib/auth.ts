import { PublicUser, Session, User } from '@/types';
import {
  DEFAULT_GOALS,
  adoptLegacyData,
  countUsers,
  createSession,
  createUser,
  deleteAllUserData,
  deleteSession,
  getUserByUsername,
  normalizeUsername,
} from './db';
import { generateToken, hashPassword, verifyPassword } from './password';
import { DEFAULT_TIMEZONE } from './dates';

export const SESSION_COOKIE = 'heilthy_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const PASSWORD_MIN = 6;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthResult {
  user: PublicUser;
  token: string;
  adoptedMeals: number;
}

/** Strips the password hash before a user object ever leaves the server. */
export function toPublicUser(user: User): PublicUser {
  const { password_hash: _hash, ...safe } = user;
  return safe;
}

export function validateUsername(raw: string): string {
  const username = (raw ?? '').trim();
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    throw new AuthError(`اسم المستخدم لازم يكون بين ${USERNAME_MIN} و${USERNAME_MAX} حرف`);
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthError('اسم المستخدم يقبل حروف إنجليزية وأرقام و _ و . فقط');
  }
  return username;
}

export function validatePassword(raw: string): string {
  const password = raw ?? '';
  if (password.length < PASSWORD_MIN) {
    throw new AuthError(`كلمة المرور لازم تكون ${PASSWORD_MIN} أحرف على الأقل`);
  }
  return password;
}

async function startSession(user: User): Promise<string> {
  const token = generateToken();
  const now = new Date();
  const session: Session = {
    token,
    user_id: user.id,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
  };
  await createSession(session);
  return token;
}

export async function signUp(
  rawUsername: string,
  rawPassword: string,
  displayName?: string
): Promise<AuthResult> {
  const username = validateUsername(rawUsername);
  const password = validatePassword(rawPassword);

  if (await getUserByUsername(username)) {
    throw new AuthError('اسم المستخدم محجوز، جرّب اسم ثاني', 409);
  }

  const isFirstAccount = (await countUsers()) === 0;

  const user: User = {
    id: crypto.randomUUID(),
    username,
    password_hash: await hashPassword(password),
    display_name: displayName?.trim() || username,
    language: 'ar',
    timezone: DEFAULT_TIMEZONE,
    theme: 'dark',
    notifications_enabled: false,
    ...DEFAULT_GOALS,
    created_at: new Date().toISOString(),
  };

  await createUser(user);
  const adoptedMeals = isFirstAccount ? await adoptLegacyData(user.id) : 0;
  const token = await startSession(user);

  return { user: toPublicUser(user), token, adoptedMeals };
}

export async function signIn(rawUsername: string, rawPassword: string): Promise<AuthResult> {
  const username = normalizeUsername(rawUsername ?? '');
  const password = rawPassword ?? '';
  if (!username || !password) {
    throw new AuthError('اكتب اسم المستخدم وكلمة المرور', 401);
  }

  const user = await getUserByUsername(username);
  // Always run a verify so a missing user and a wrong password cost the same time.
  const ok = await verifyPassword(password, user?.password_hash ?? 'scrypt$00$00');
  if (!user || !ok) {
    throw new AuthError('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
  }

  const token = await startSession(user);
  return { user: toPublicUser(user), token, adoptedMeals: 0 };
}

export async function signOut(token: string): Promise<void> {
  if (token) await deleteSession(token);
}

const DEFAULT_USERNAME = 'me';

/** Returns (and creates if missing) the single default user used when login is disabled. */
export async function getDefaultUser(): Promise<User> {
  const existing = await getUserByUsername(DEFAULT_USERNAME);
  if (existing) return existing;

  const user: User = {
    id: crypto.randomUUID(),
    username: DEFAULT_USERNAME,
    password_hash: await hashPassword('default'),
    display_name: DEFAULT_USERNAME,
    language: 'ar',
    timezone: DEFAULT_TIMEZONE,
    theme: 'dark',
    notifications_enabled: false,
    ...DEFAULT_GOALS,
    created_at: new Date().toISOString(),
  };

  await createUser(user);
  return user;
}

export async function deleteAccount(userId: string): Promise<void> {
  await deleteAllUserData(userId);
}
