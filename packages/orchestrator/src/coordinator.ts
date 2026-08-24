import { OrchestrationPlan, OrchestrationResult, SubAgentRunner, SubTask } from './types.js';
import { getToolsForRole } from './planner.js';

export class Coordinator {
  constructor(private readonly runner: SubAgentRunner) {}

  async execute(plan: OrchestrationPlan, signal: AbortSignal): Promise<OrchestrationResult> {
    const start = Date.now();
    let totalTokens = 0;
    const tasks = [...plan.subTasks];

    while (tasks.some(t => t.status === 'pending' || t.status === 'running')) {
      if (signal.aborted) break;

      // Find tasks whose dependencies are all completed
      const ready = tasks.filter(
        t =>
          t.status === 'pending' &&
          t.dependsOn.every(dep => tasks.find(d => d.id === dep)?.status === 'completed'),
      );

      if (ready.length === 0) {
        // Check for deadlock or failures — if any upstream dep failed, no more progress
        const failed = tasks.filter(t => t.status === 'failed');
        if (failed.length > 0) break;
        break; // no more progress possible
      }

      // Run ready tasks in parallel
      await Promise.all(
        ready.map(async (task: SubTask) => {
          task.status = 'running';
          try {
            const tools = getToolsForRole(task.role);
            const result = await this.runner(task.role, task.request, tools, signal);
            task.status = result.success ? 'completed' : 'failed';
            task.result = result.result;
            if (!result.success) task.error = result.result;
            totalTokens += result.tokens;
          } catch (err) {
            task.status = 'failed';
            task.error = err instanceof Error ? err.message : String(err);
          }
        }),
      );
    }

    const success = tasks.every(t => t.status === 'completed');
    const results = tasks.map(t => t.result ?? '').filter(Boolean);
    const failedCount = tasks.filter(t => t.status === 'failed').length;
    const finalReport = success
      ? `Orchestration complete.\n\nResults:\n${results.join('\n\n')}`
      : `Orchestration partially completed. ${failedCount} task(s) failed.`;

    return {
      goal: plan.goal,
      success,
      subTaskResults: tasks,
      finalReport,
      totalTokens,
      durationMs: Date.now() - start,
    };
  }
}
