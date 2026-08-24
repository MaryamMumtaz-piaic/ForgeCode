import { randomUUID } from 'crypto';
import { getDb } from './db.js';
import { CreateTaskInput, Task, TaskStatus, TaskStep, UpdateTaskInput } from './types.js';

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  steps: string;
  agent_id: string | null;
  cwd: string;
  user_request: string;
  result: string | null;
  error: string | null;
  total_tokens: number;
  total_tool_calls: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    steps: JSON.parse(row.steps) as TaskStep[],
    agentId: row.agent_id ?? undefined,
    cwd: row.cwd,
    userRequest: row.user_request,
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    totalTokens: row.total_tokens,
    totalToolCalls: row.total_tool_calls,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export class TaskStore {
  create(input: CreateTaskInput): Task {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO tasks (id, title, description, status, steps, agent_id, cwd,
        user_request, total_tokens, total_tool_calls, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id, input.title, input.description, TaskStatus.PENDING,
      '[]', input.agentId ?? null, input.cwd,
      input.userRequest, now, now,
    );
    return this.getById(id)!;
  }

  getById(id: string): Task | undefined {
    const row = getDb()
      .prepare('SELECT * FROM tasks WHERE id = ?')
      .get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  list(status?: TaskStatus, limit = 50): Task[] {
    const db = getDb();
    const rows = status
      ? (db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC LIMIT ?').all(status, limit) as TaskRow[])
      : (db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?').all(limit) as TaskRow[]);
    return rows.map(rowToTask);
  }

  update(id: string, input: UpdateTaskInput): Task | undefined {
    const db = getDb();
    const now = new Date().toISOString();
    const isTerminal =
      input.status === TaskStatus.COMPLETED ||
      input.status === TaskStatus.FAILED ||
      input.status === TaskStatus.CANCELLED;

    db.prepare(`
      UPDATE tasks SET
        status = COALESCE(?, status),
        steps = COALESCE(?, steps),
        result = COALESCE(?, result),
        error = COALESCE(?, error),
        total_tokens = COALESCE(?, total_tokens),
        total_tool_calls = COALESCE(?, total_tool_calls),
        updated_at = ?,
        completed_at = CASE WHEN ? THEN ? ELSE completed_at END
      WHERE id = ?
    `).run(
      input.status ?? null,
      input.steps ? JSON.stringify(input.steps) : null,
      input.result ?? null,
      input.error ?? null,
      input.totalTokens ?? null,
      input.totalToolCalls ?? null,
      now,
      isTerminal ? 1 : 0,
      isTerminal ? now : null,
      id,
    );

    return this.getById(id);
  }

  cancel(id: string): Task | undefined {
    return this.update(id, { status: TaskStatus.CANCELLED });
  }

  delete(id: string): void {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  countByStatus(): Record<TaskStatus, number> {
    const db = getDb();
    const rows = db.prepare(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status',
    ).all() as { status: string; count: number }[];
    const result = Object.fromEntries(
      Object.values(TaskStatus).map(s => [s, 0]),
    ) as Record<TaskStatus, number>;
    for (const row of rows) {
      if (row.status in result) result[row.status as TaskStatus] = row.count;
    }
    return result;
  }
}
