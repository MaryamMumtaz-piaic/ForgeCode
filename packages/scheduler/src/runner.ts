import { randomUUID } from 'crypto';
import { Cron } from 'croner';
import {
  BackgroundAgentState,
  BackgroundAgentStatus,
  BackgroundJob,
  ScheduleConfig,
} from './types.js';

export type AgentExecuteFn = (
  agentId: string,
  userRequest: string,
  cwd: string,
) => Promise<{ success: boolean; tokens: number; error?: string }>;

export class BackgroundRunner {
  private readonly jobs = new Map<string, BackgroundJob>();

  schedule(params: {
    agentId: string;
    agentName: string;
    userRequest: string;
    cwd: string;
    schedule: ScheduleConfig;
    executeFn: AgentExecuteFn;
  }): BackgroundJob {
    const jobId = randomUUID();

    const state: BackgroundAgentState = {
      agentId: params.agentId,
      agentName: params.agentName,
      status: BackgroundAgentStatus.IDLE,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTokens: 0,
      cwd: params.cwd,
    };

    let cronJob: ReturnType<typeof Cron> | null = null;
    let intervalTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const runOnce = async (): Promise<void> => {
      if (stopped) return;
      state.status = BackgroundAgentStatus.RUNNING;
      state.lastRunAt = new Date();
      try {
        const result = await params.executeFn(
          params.agentId,
          params.userRequest,
          params.cwd,
        );
        if (result.success) {
          state.tasksCompleted++;
        } else {
          state.tasksFailed++;
          state.lastError = result.error;
        }
        state.totalTokens += result.tokens;
        state.status = BackgroundAgentStatus.IDLE;
      } catch (err) {
        state.tasksFailed++;
        state.lastError = err instanceof Error ? err.message : String(err);
        state.status = BackgroundAgentStatus.ERROR;
      }
    };

    const stop = (): void => {
      stopped = true;
      cronJob?.stop();
      if (intervalTimer) clearInterval(intervalTimer);
      state.status = BackgroundAgentStatus.STOPPED;
      this.jobs.delete(jobId);
    };

    // Schedule based on type
    switch (params.schedule.type) {
      case 'once': {
        const delay = params.schedule.runAt
          ? Math.max(0, params.schedule.runAt.getTime() - Date.now())
          : 0;
        setTimeout(() => {
          void runOnce();
        }, delay);
        break;
      }
      case 'interval': {
        const ms = params.schedule.intervalMs ?? 30 * 60 * 1000;
        void runOnce(); // run immediately
        intervalTimer = setInterval(() => {
          void runOnce();
        }, ms);
        state.nextRunAt = new Date(Date.now() + ms);
        break;
      }
      case 'cron': {
        const expr = params.schedule.cron ?? '0 * * * *';
        cronJob = Cron(expr, () => {
          void runOnce();
        });
        state.nextRunAt = cronJob.nextRun() ?? undefined;
        break;
      }
    }

    const job: BackgroundJob = {
      id: jobId,
      agentId: params.agentId,
      agentName: params.agentName,
      userRequest: params.userRequest,
      cwd: params.cwd,
      schedule: params.schedule,
      state,
      stop,
    };

    this.jobs.set(jobId, job);
    return job;
  }

  list(): BackgroundJob[] {
    return [...this.jobs.values()];
  }

  stop(jobId: string): void {
    this.jobs.get(jobId)?.stop();
  }

  stopAll(): void {
    for (const job of this.jobs.values()) {
      job.stop();
    }
  }

  getState(jobId: string): BackgroundAgentState | undefined {
    return this.jobs.get(jobId)?.state;
  }
}
