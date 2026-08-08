import { Meal, Session, User } from '@/types';

/**
 * Storage contract shared by every backend.
 *
 * Two drivers implement it:
 *  - `json`     a local file, used for development and self-hosting
 *  - `postgres` used whenever DATABASE_URL is set (Neon, Supabase, any Postgres)
 *
 * Every meal method takes a userId and filters on it, so one account can never
 * read or mutate another account's rows.
 */
export interface Store {
  /** Creates tables/indexes if they do not exist yet. Safe to call repeatedly. */
  init(): Promise<void>;

  getUserByUsername(username: string): Promise<User | undefined>;
  countUsers(): Promise<number>;
  createUser(user: User): Promise<void>;
  updateUser(userId: string, patch: Partial<User>): Promise<User | undefined>;
  deleteUser(userId: string): Promise<void>;

  createSession(session: Session): Promise<void>;
  getUserBySessionToken(token: string): Promise<User | undefined>;
  deleteSession(token: string): Promise<void>;

  getMeals(userId: string, logicalDate?: string): Promise<Meal[]>;
  getMealById(userId: string, id: string): Promise<Meal | undefined>;
  createMeal(meal: Meal): Promise<void>;
  updateMeal(userId: string, meal: Meal): Promise<void>;
  deleteMeal(userId: string, id: string): Promise<void>;
  clearUserMeals(userId: string): Promise<void>;

  /**
   * Hands meals written before accounts existed to the first real account and
   * removes the placeholder rows. Returns how many meals were adopted.
   */
  adoptLegacyData(userId: string): Promise<number>;
}

/** Fields a generic patch is never allowed to touch. */
export const IMMUTABLE_USER_FIELDS = ['id', 'username', 'password_hash', 'created_at'] as const;

export function sanitizeUserPatch(patch: Partial<User>): Partial<User> {
  const clean: Partial<User> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if ((IMMUTABLE_USER_FIELDS as readonly string[]).includes(key)) continue;
    Object.assign(clean, { [key]: value });
  }
  return clean;
}
