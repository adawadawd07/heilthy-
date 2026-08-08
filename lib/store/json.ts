import { promises as fs } from 'fs';
import path from 'path';
import { DbSchema, Store, emptyDb } from './types';

let writeQueue: Promise<void> = Promise.resolve();

export class JsonStore implements Store {
  private dataDir: string;
  private dbPath: string;

  constructor() {
    this.dataDir = process.env.DATA_DIR
      ? path.resolve(process.env.DATA_DIR)
      : path.join(process.cwd(), 'data');
    this.dbPath = path.join(this.dataDir, 'db.json');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async readDb(): Promise<DbSchema> {
    try {
      const content = await fs.readFile(this.dbPath, 'utf-8');
      const parsed = JSON.parse(content) as Partial<DbSchema>;
      return { ...emptyDb(), ...(parsed || {}) };
    } catch {
      return emptyDb();
    }
  }

  async writeDb(db: DbSchema): Promise<void> {
    const task = writeQueue.then(async () => {
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmpPath = `${this.dbPath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
      await fs.rename(tmpPath, this.dbPath);
    });
    writeQueue = task.catch(() => {});
    return task;
  }
}
