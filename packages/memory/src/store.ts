import { randomUUID } from 'crypto';
import { getMemoryDb } from './db.js';

export type MemoryScope = 'session' | 'project' | 'agent' | 'task';

export interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  scopeId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: Date;
}

interface MemoryRow {
  id: string; scope: string; scope_id: string;
  key: string; value: string;
  created_at: string; updated_at: string;
}

interface HistoryRow {
  id: string; session_id: string; role: string;
  content: string; created_at: string;
}

export class MemoryStore {
  set(scope: MemoryScope, scopeId: string, key: string, value: string): void {
    const db = getMemoryDb();
    const now = new Date().toISOString();
    const existing = db.prepare(
      'SELECT id FROM memories WHERE scope = ? AND scope_id = ? AND key = ?',
    ).get(scope, scopeId, key) as { id: string } | undefined;

    if (existing) {
      db.prepare('UPDATE memories SET value = ?, updated_at = ? WHERE id = ?')
        .run(value, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO memories (id, scope, scope_id, key, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), scope, scopeId, key, value, now, now);
    }
  }

  get(scope: MemoryScope, scopeId: string, key: string): string | undefined {
    const row = getMemoryDb()
      .prepare('SELECT value FROM memories WHERE scope = ? AND scope_id = ? AND key = ?')
      .get(scope, scopeId, key) as { value: string } | undefined;
    return row?.value;
  }

  getAll(scope: MemoryScope, scopeId: string): MemoryEntry[] {
    const rows = getMemoryDb()
      .prepare('SELECT * FROM memories WHERE scope = ? AND scope_id = ? ORDER BY updated_at DESC')
      .all(scope, scopeId) as MemoryRow[];
    return rows.map(r => ({
      id: r.id, scope: r.scope as MemoryScope, scopeId: r.scope_id,
      key: r.key, value: r.value,
      createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
    }));
  }

  delete(scope: MemoryScope, scopeId: string, key: string): void {
    getMemoryDb()
      .prepare('DELETE FROM memories WHERE scope = ? AND scope_id = ? AND key = ?')
      .run(scope, scopeId, key);
  }

  clear(scope: MemoryScope, scopeId: string): void {
    getMemoryDb()
      .prepare('DELETE FROM memories WHERE scope = ? AND scope_id = ?')
      .run(scope, scopeId);
  }

  // Session history
  appendHistory(sessionId: string, role: 'user' | 'assistant' | 'tool', content: string): void {
    const now = new Date().toISOString();
    getMemoryDb().prepare(`
      INSERT INTO session_history (id, session_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), sessionId, role, content, now);
  }

  getHistory(sessionId: string, limit = 50): HistoryMessage[] {
    const rows = getMemoryDb()
      .prepare('SELECT * FROM session_history WHERE session_id = ? ORDER BY created_at ASC LIMIT ?')
      .all(sessionId, limit) as HistoryRow[];
    return rows.map(r => ({
      id: r.id, sessionId: r.session_id,
      role: r.role as 'user' | 'assistant' | 'tool',
      content: r.content, createdAt: new Date(r.created_at),
    }));
  }

  clearHistory(sessionId: string): void {
    getMemoryDb()
      .prepare('DELETE FROM session_history WHERE session_id = ?')
      .run(sessionId);
  }
}
