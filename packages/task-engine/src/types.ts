export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export interface TaskStep {
  stepNumber: number;
  description: string;
  status: 'pending' | 'active' | 'done' | 'failed';
  toolName?: string;
  durationMs?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  steps: TaskStep[];
  agentId?: string;
  cwd: string;
  userRequest: string;
  result?: string;
  error?: string;
  totalTokens: number;
  totalToolCalls: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  userRequest: string;
  cwd: string;
  agentId?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  steps?: TaskStep[];
  result?: string;
  error?: string;
  totalTokens?: number;
  totalToolCalls?: number;
}
