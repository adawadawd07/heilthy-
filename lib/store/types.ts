import { User, UserPreferences, Meal, FavoriteMeal, Session } from '@/types';

export interface DbSchema {
  users: User[];
  preferences: UserPreferences[];
  meals: Meal[];
  favorites: FavoriteMeal[];
  sessions: Session[];
}

export interface Store {
  init(): Promise<void>;
  readDb(): Promise<DbSchema>;
  writeDb(db: DbSchema): Promise<void>;
}

export function emptyDb(): DbSchema {
  return { users: [], preferences: [], meals: [], favorites: [], sessions: [] };
}
