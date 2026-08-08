import { Meal, User, UserPreferences, FavoriteMeal, Session } from '@/types';
import { DbSchema, Store, emptyDb } from './store/types';
import { JsonStore } from './store/json';
import { PostgresStore } from './store/postgres';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    const connectionString = process.env.DATABASE_URL;
    const newStore = connectionString ? new PostgresStore(connectionString) : new JsonStore();
    await newStore.init();
    store = newStore;
  }
  return store;
}

async function readDb(): Promise<DbSchema> {
  const s = await getStore();
  return s.readDb();
}

async function writeDb(db: DbSchema): Promise<void> {
  const s = await getStore();
  return s.writeDb(db);
}

export const DEFAULT_GOALS = {
  daily_calories: 2000,
  daily_protein_g: 150,
  daily_carbs_g: 200,
  daily_fat_g: 60,
} as const;

export async function getMeals(userId: string, logicalDate?: string): Promise<Meal[]> {
  const db = await readDb();
  return db.meals
    .filter((m) => m.user_id === userId && (logicalDate ? m.logical_date === logicalDate : true))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getMealById(userId: string, id: string): Promise<Meal | undefined> {
  const db = await readDb();
  return db.meals.find((m) => m.id === id && m.user_id === userId);
}

export async function createMeal(meal: Meal): Promise<void> {
  const db = await readDb();
  db.meals.push(meal);
  await writeDb(db);
}

export async function updateMeal(userId: string, meal: Meal): Promise<void> {
  const db = await readDb();
  const idx = db.meals.findIndex((m) => m.id === meal.id && m.user_id === userId);
  if (idx === -1) throw new Error('Meal not found');
  db.meals[idx] = { ...meal, updated_at: new Date().toISOString() };
  await writeDb(db);
}

export async function deleteMeal(userId: string, id: string): Promise<void> {
  const db = await readDb();
  db.meals = db.meals.filter((m) => !(m.id === id && m.user_id === userId));
  await writeDb(db);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.id === id);
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<User | undefined> {
  const db = await readDb();
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as Partial<User>;
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return undefined;

  // id, username and password_hash can never be changed through a generic patch
  const { id: _id, username: _username, password_hash: _hash, ...safe } = defined;
  db.users[idx] = { ...db.users[idx], ...safe };
  await writeDb(db);
  return db.users[idx];
}

export async function setPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  db.users[idx] = { ...db.users[idx], password_hash: passwordHash };
  await writeDb(db);
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await readDb();
  const key = normalizeUsername(username);
  return db.users.find((u) => normalizeUsername(u.username ?? '') === key);
}

/**
 * Counts real accounts only. Rows without a username are pre-account
 * placeholders left by older versions and must not block the first signup.
 */
export async function countUsers(): Promise<number> {
  const db = await readDb();
  return db.users.filter((u) => Boolean(u.username)).length;
}

export async function createUser(user: User): Promise<void> {
  const db = await readDb();
  db.users.push(user);
  db.preferences.push({
    user_id: user.id,
    language: user.language,
    timezone: user.timezone,
    theme: user.theme,
    notifications_enabled: user.notifications_enabled,
    daily_calories: user.daily_calories,
    daily_protein_g: user.daily_protein_g,
    daily_carbs_g: user.daily_carbs_g,
    daily_fat_g: user.daily_fat_g,
  });
  await writeDb(db);
}

export async function createSession(session: Session): Promise<void> {
  const db = await readDb();
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => new Date(s.expires_at).getTime() > now);
  db.sessions.push(session);
  await writeDb(db);
}

/** Resolves a session token to its user, ignoring (and pruning) expired tokens. */
export async function getUserBySessionToken(token: string): Promise<User | undefined> {
  if (!token) return undefined;
  const db = await readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return undefined;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    await writeDb(db);
    return undefined;
  }
  return db.users.find((u) => u.id === session.user_id);
}

export async function deleteSession(token: string): Promise<void> {
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDb(db);
}

export async function getPreferences(userId: string): Promise<UserPreferences | undefined> {
  const db = await readDb();
  return db.preferences.find((p) => p.user_id === userId);
}

export async function updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
  const db = await readDb();
  const defined = Object.fromEntries(
    Object.entries(prefs).filter(([, value]) => value !== undefined)
  ) as Partial<UserPreferences>;
  const idx = db.preferences.findIndex((p) => p.user_id === userId);
  if (idx === -1) {
    db.preferences.push({
      language: 'ar',
      timezone: 'Asia/Riyadh',
      theme: 'system',
      notifications_enabled: false,
      ...DEFAULT_GOALS,
      ...defined,
      user_id: userId,
    });
  } else {
    db.preferences[idx] = { ...db.preferences[idx], ...defined, user_id: userId };
  }
  await writeDb(db);
}

export async function getFavorites(userId: string): Promise<FavoriteMeal[]> {
  const db = await readDb();
  return db.favorites.filter((f) => f.user_id === userId);
}

export async function createFavorite(favorite: FavoriteMeal): Promise<void> {
  const db = await readDb();
  db.favorites.push(favorite);
  await writeDb(db);
}

export async function deleteFavorite(userId: string, id: string): Promise<void> {
  const db = await readDb();
  db.favorites = db.favorites.filter((f) => !(f.id === id && f.user_id === userId));
  await writeDb(db);
}

export async function deleteAllUserData(userId: string): Promise<void> {
  const db = await readDb();
  db.meals = db.meals.filter((m) => m.user_id !== userId);
  db.favorites = db.favorites.filter((f) => f.user_id !== userId);
  db.preferences = db.preferences.filter((p) => p.user_id !== userId);
  db.users = db.users.filter((u) => u.id !== userId);
  db.sessions = db.sessions.filter((s) => s.user_id !== userId);
  await writeDb(db);
}

/** Wipes a user's logged data but keeps the account itself. */
export async function clearUserMeals(userId: string): Promise<void> {
  const db = await readDb();
  db.meals = db.meals.filter((m) => m.user_id !== userId);
  db.favorites = db.favorites.filter((f) => f.user_id !== userId);
  await writeDb(db);
}

/**
 * One-time migration: meals written before accounts existed belong to the
 * placeholder `local-user`. The first real account adopts them so nothing is
 * lost, and the placeholder row is removed either way.
 */
export async function adoptLegacyData(userId: string): Promise<number> {
  const db = await readDb();
  const orphans = db.users.filter((u) => !u.username).map((u) => u.id);
  if (orphans.length === 0) return 0;

  const adopted = db.meals.filter((m) => orphans.includes(m.user_id)).length;

  db.meals = db.meals.map((m) => (orphans.includes(m.user_id) ? { ...m, user_id: userId } : m));
  db.favorites = db.favorites.map((f) =>
    orphans.includes(f.user_id) ? { ...f, user_id: userId } : f
  );
  db.users = db.users.filter((u) => !orphans.includes(u.id));
  db.preferences = db.preferences.filter((p) => !orphans.includes(p.user_id));
  db.sessions = db.sessions.filter((s) => !orphans.includes(s.user_id));
  await writeDb(db);
  return adopted;
}
