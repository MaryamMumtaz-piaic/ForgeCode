import { ZodSchema } from 'zod';

export enum PermissionLevel {
  SAFE = 'SAFE',
  APPROVAL = 'APPROVAL',
  HIGH_RISK = 'HIGH_RISK',
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

export interface AgentTool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodSchema<TInput>;
  readonly permission: PermissionLevel;
  execute(input: TInput, signal?: AbortSignal): Promise<ToolResult>;
}

export interface ToolCall {
  callId: string;
  toolName: string;
  input: unknown;
  requestedAt: Date;
}

export interface ToolCallResult {
  call: ToolCall;
  result: ToolResult;
  startedAt: Date;
  completedAt: Date;
}
