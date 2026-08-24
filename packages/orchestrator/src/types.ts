export interface SubAgentSpec {
  role: string;
  mission: string;
  tools: string[];
  maxSteps?: number;
}

export interface OrchestrationPlan {
  goal: string;
  subTasks: SubTask[];
}

export interface SubTask {
  id: string;
  role: string;
  request: string;
  dependsOn: string[]; // ids of sub-tasks that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface OrchestrationResult {
  goal: string;
  success: boolean;
  subTaskResults: SubTask[];
  finalReport: string;
  totalTokens: number;
  durationMs: number;
}

export type SubAgentRunner = (
  role: string,
  request: string,
  tools: string[],
  signal: AbortSignal,
) => Promise<{ success: boolean; result: string; tokens: number }>;
