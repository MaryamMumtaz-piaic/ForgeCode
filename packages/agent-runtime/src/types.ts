export enum AgentState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  PLANNING = 'PLANNING',
  SEARCHING = 'SEARCHING',
  READING = 'READING',
  EDITING = 'EDITING',
  EXECUTING = 'EXECUTING',
  WAITING_FOR_APPROVAL = 'WAITING_FOR_APPROVAL',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface AgentConfig {
  model: string;
  maxSteps: number;
  maxToolCalls: number;
  maxExecutionTimeMs: number;
  systemPrompt?: string;
}

export interface TaskStep {
  stepNumber: number;
  state: AgentState;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  reasoning?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

export interface AgentTask {
  taskId: string;
  userRequest: string;
  state: AgentState;
  steps: TaskStep[];
  startedAt: Date;
  completedAt?: Date;
  result?: string;
  error?: string;
  totalTokens: number;
  totalToolCalls: number;
}

export interface AgentEvent {
  type:
    | 'state_change'
    | 'text_delta'
    | 'tool_start'
    | 'tool_end'
    | 'step_complete'
    | 'task_complete'
    | 'error';
  taskId: string;
  state?: AgentState;
  delta?: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  stepNumber?: number;
  error?: string;
  result?: string;
}
