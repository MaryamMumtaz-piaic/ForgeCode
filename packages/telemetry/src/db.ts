import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _db: Database.Database | null = null;

export function getTelemetryDb(): Database.Database {
  if (_db) return _db;
  const dir = path.join(os.homedir(), '.forgecode');
  fs.mkdirSync(dir, { recursive: true });
  _db = new Database(path.join(dir, 'telemetry.db'));
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS traces (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      agent_id TEXT,
      model TEXT NOT NULL,
      user_request TEXT NOT NULL,
      cwd TEXT NOT NULL,
      status TEXT NOT NULL,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tool_calls INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS trace_steps (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      tool_name TEXT,
      tool_input TEXT,
      tool_output TEXT,
      duration_ms INTEGER,
      success INTEGER NOT NULL DEFAULT 1,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_traces_task ON traces(task_id);
    CREATE INDEX IF NOT EXISTS idx_traces_started ON traces(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_steps_trace ON trace_steps(trace_id, step_number);
  `);
  return _db;
}
