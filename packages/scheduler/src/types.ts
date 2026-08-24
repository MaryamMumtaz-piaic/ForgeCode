export enum BackgroundAgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface BackgroundAgentState {
  agentId: string;
  agentName: string;
  status: BackgroundAgentStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  tasksCompleted: number;
  tasksFailed: number;
  totalTokens: number;
  lastError?: string;
  cwd: string;
}

export interface ScheduleConfig {
  type: 'once' | 'interval' | 'cron';
  intervalMs?: number;   // for type: 'interval'
  cron?: string;         // for type: 'cron', e.g. '*/30 * * * *'
  runAt?: Date;          // for type: 'once'
}

export interface BackgroundJob {
  id: string;
  agentId: string;
  agentName: string;
  userRequest: string;
  cwd: string;
  schedule: ScheduleConfig;
  state: BackgroundAgentState;
  stop(): void;
}
