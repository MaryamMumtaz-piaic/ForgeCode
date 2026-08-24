import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _db: Database.Database | null = null;

function getDbPath(): string {
  const dir = path.join(os.homedir(), '.forgecode');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'tasks.db');
}

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(getDbPath());
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      steps TEXT NOT NULL DEFAULT '[]',
      agent_id TEXT,
      cwd TEXT NOT NULL,
      user_request TEXT NOT NULL,
      result TEXT,
      error TEXT,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      total_tool_calls INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
  `);
}
