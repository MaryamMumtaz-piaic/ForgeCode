import { TaskStore, TaskStatus } from '@forgecode/task-engine';

export async function listTasks(status?: string): Promise<void> {
  const store = new TaskStore();
  const tasks = store.list(status as TaskStatus | undefined);
  if (tasks.length === 0) {
    console.log('No tasks found.');
    return;
  }
  for (const task of tasks) {
    const elapsed = task.completedAt
      ? `${((task.completedAt.getTime() - task.createdAt.getTime()) / 1000).toFixed(1)}s`
      : 'in progress';
    console.log(`[${task.status.toUpperCase()}] ${task.title} — ${elapsed}`);
    console.log(`  ID: ${task.id}`);
    console.log(`  ${task.userRequest.slice(0, 80)}`);
    console.log('');
  }
}
