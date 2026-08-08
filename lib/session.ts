import { NextResponse } from 'next/server';
import { User } from '@/types';
import { getDefaultUser } from './auth';

/** Always returns the default single user; login is disabled. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await getDefaultUser();
  } catch {
    return null;
  }
}

/** Always returns the default single user; login is disabled. */
export async function requireUser(_?: string): Promise<User> {
  return getDefaultUser();
}

/** Always returns the default single user; no 401 responses are issued. */
export async function requireApiUser(): Promise<{ user: User; response?: NextResponse }> {
  const user = await getDefaultUser();
  return { user };
}
