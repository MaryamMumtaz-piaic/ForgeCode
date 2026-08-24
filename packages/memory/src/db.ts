import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _db: Database.Database | null = null;

export function getMemoryDb(): Database.Database {
  if (_db) return _db;
  const dir = path.join(os.homedir(), '.forgecode');
  fs.mkdirSync(dir, { recursive: true });
  _db = new Database(path.join(dir, 'memory.db'));
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(scope, scope_id, key)
    );
    CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope, scope_id);

    CREATE TABLE IF NOT EXISTS session_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_history_session ON session_history(session_id, created_at);
  `);
  return _db;
}
