import { neon } from '@neondatabase/serverless';
import { DbSchema, Store, emptyDb } from './types';

function cleanConnectionString(connectionString: string): string {
  const queryIndex = connectionString.indexOf('?');
  return queryIndex === -1 ? connectionString : connectionString.slice(0, queryIndex);
}

export class PostgresStore implements Store {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    this.sql = neon(cleanConnectionString(connectionString));
  }

  async init(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL
      )
    `;
  }

  async readDb(): Promise<DbSchema> {
    const rows = await this.sql`SELECT data FROM app_state WHERE id = 'db'` as unknown as { data: DbSchema }[];
    if (!rows || rows.length === 0) return emptyDb();
    return { ...emptyDb(), ...(rows[0].data ?? {}) };
  }

  async writeDb(db: DbSchema): Promise<void> {
    const payload = JSON.stringify(db);
    await this.sql`
      INSERT INTO app_state (id, data)
      VALUES ('db', ${payload}::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
    `;
  }
}
