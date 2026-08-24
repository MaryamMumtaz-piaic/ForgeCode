import { randomUUID } from 'crypto';
import { getTelemetryDb } from './db.js';

export interface TraceStep {
  id: string;
  traceId: string;
  stepNumber: number;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  durationMs?: number;
  success: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface Trace {
  id: string;
  taskId: string;
  agentId?: string;
  model: string;
  userRequest: string;
  cwd: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalToolCalls: number;
  durationMs?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  steps: TraceStep[];
}

interface TraceRow {
  id: string; task_id: string; agent_id: string | null; model: string;
  user_request: string; cwd: string; status: string;
  total_tokens: number; prompt_tokens: number; completion_tokens: number;
  total_tool_calls: number; duration_ms: number | null;
  started_at: string; completed_at: string | null; error: string | null;
}

interface StepRow {
  id: string; trace_id: string; step_number: number;
  tool_name: string | null; tool_input: string | null; tool_output: string | null;
  duration_ms: number | null; success: number;
  started_at: string; completed_at: string | null;
}

function rowToStep(row: StepRow): TraceStep {
  return {
    id: row.id, traceId: row.trace_id, stepNumber: row.step_number,
    toolName: row.tool_name ?? undefined,
    toolInput: row.tool_input ? JSON.parse(row.tool_input) : undefined,
    toolOutput: row.tool_output ? JSON.parse(row.tool_output) : undefined,
    durationMs: row.duration_ms ?? undefined,
    success: row.success === 1,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export class TraceRecorder {
  private traceId: string;
  private startedAt = new Date();

  constructor(
    private readonly taskId: string,
    private readonly model: string,
    private readonly userRequest: string,
    private readonly cwd: string,
    private readonly agentId?: string,
  ) {
    this.traceId = randomUUID();
    const now = this.startedAt.toISOString();
    getTelemetryDb().prepare(`
      INSERT INTO traces (id, task_id, agent_id, model, user_request, cwd, status, started_at)
      VALUES (?, ?, ?, ?, ?, ?, 'running', ?)
    `).run(this.traceId, taskId, agentId ?? null, model, userRequest, cwd, now);
  }

  get id() { return this.traceId; }

  recordStep(params: {
    stepNumber: number;
    toolName?: string;
    toolInput?: unknown;
    toolOutput?: unknown;
    durationMs?: number;
    success?: boolean;
  }): void {
    const now = new Date().toISOString();
    getTelemetryDb().prepare(`
      INSERT INTO trace_steps
        (id, trace_id, step_number, tool_name, tool_input, tool_output, duration_ms, success, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), this.traceId, params.stepNumber,
      params.toolName ?? null,
      params.toolInput !== undefined ? JSON.stringify(params.toolInput) : null,
      params.toolOutput !== undefined ? JSON.stringify(params.toolOutput) : null,
      params.durationMs ?? null,
      params.success !== false ? 1 : 0,
      now, now,
    );
  }

  complete(params: {
    status: 'completed' | 'failed' | 'cancelled';
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalToolCalls?: number;
    error?: string;
  }): void {
    const now = new Date().toISOString();
    const durationMs = Date.now() - this.startedAt.getTime();
    getTelemetryDb().prepare(`
      UPDATE traces SET
        status = ?, total_tokens = ?, prompt_tokens = ?, completion_tokens = ?,
        total_tool_calls = ?, duration_ms = ?, completed_at = ?, error = ?
      WHERE id = ?
    `).run(
      params.status,
      params.totalTokens ?? 0,
      params.promptTokens ?? 0,
      params.completionTokens ?? 0,
      params.totalToolCalls ?? 0,
      durationMs, now,
      params.error ?? null,
      this.traceId,
    );
  }
}

export function getTrace(traceId: string): Trace | undefined {
  const db = getTelemetryDb();
  const row = db.prepare('SELECT * FROM traces WHERE id = ?').get(traceId) as TraceRow | undefined;
  if (!row) return undefined;
  const stepRows = db.prepare('SELECT * FROM trace_steps WHERE trace_id = ? ORDER BY step_number').all(traceId) as StepRow[];
  return {
    id: row.id, taskId: row.task_id, agentId: row.agent_id ?? undefined,
    model: row.model, userRequest: row.user_request, cwd: row.cwd,
    status: row.status as Trace['status'],
    totalTokens: row.total_tokens, promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens, totalToolCalls: row.total_tool_calls,
    durationMs: row.duration_ms ?? undefined,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    error: row.error ?? undefined,
    steps: stepRows.map(rowToStep),
  };
}

export function listTraces(limit = 20): Omit<Trace, 'steps'>[] {
  const rows = getTelemetryDb()
    .prepare('SELECT * FROM traces ORDER BY started_at DESC LIMIT ?')
    .all(limit) as TraceRow[];
  return rows.map(row => ({
    id: row.id, taskId: row.task_id, agentId: row.agent_id ?? undefined,
    model: row.model, userRequest: row.user_request, cwd: row.cwd,
    status: row.status as Trace['status'],
    totalTokens: row.total_tokens, promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens, totalToolCalls: row.total_tool_calls,
    durationMs: row.duration_ms ?? undefined,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    error: row.error ?? undefined,
  }));
}

export function formatTrace(trace: Trace): string {
  const lines: string[] = [
    `Task Trace — ${trace.taskId.slice(0, 8)}`,
    '',
  ];
  for (const step of trace.steps) {
    const dur = step.durationMs
      ? step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`
      : '';
    const icon = step.success ? '✓' : '✗';
    lines.push(` Step ${String(step.stepNumber).padStart(2)}  ${(step.toolName ?? 'llm').padEnd(28)} ${dur.padStart(6)}  ${icon}`);
  }
  lines.push('');
  const dur = trace.durationMs
    ? trace.durationMs < 1000 ? `${trace.durationMs}ms` : `${(trace.durationMs / 1000).toFixed(1)}s`
    : '—';
  lines.push(` Total: ${dur}  │  ${trace.totalTokens.toLocaleString()} tokens  │  ${trace.totalToolCalls} tool calls`);
  return lines.join('\n');
}
