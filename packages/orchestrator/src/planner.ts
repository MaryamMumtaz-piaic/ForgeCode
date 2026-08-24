import { randomUUID } from 'crypto';
import { OrchestrationPlan, SubTask } from './types.js';

// Predefined role → tool mapping
const ROLE_TOOLS: Record<string, string[]> = {
  researcher: ['filesystem.read', 'filesystem.search', 'filesystem.list'],
  coder: ['filesystem.*', 'shell.execute', 'git.*'],
  tester: ['shell.execute', 'filesystem.read', 'filesystem.search'],
  reviewer: ['filesystem.read', 'git.diff', 'git.log'],
  devops: ['shell.execute', 'filesystem.*', 'git.*'],
  documenter: ['filesystem.read', 'filesystem.write', 'filesystem.search'],
};

export function createSubTask(role: string, request: string, dependsOn: string[] = []): SubTask {
  return {
    id: randomUUID().slice(0, 8),
    role,
    request,
    dependsOn,
    status: 'pending',
  };
}

// Simple rule-based planner — for complex goals, the LLM orchestrator overrides this
export function planFromKeywords(goal: string): OrchestrationPlan {
  const lower = goal.toLowerCase();
  const tasks: SubTask[] = [];

  const researchTask = createSubTask(
    'researcher',
    `Analyze the codebase and gather context for: ${goal}`,
  );
  tasks.push(researchTask);

  if (
    lower.includes('fix') ||
    lower.includes('bug') ||
    lower.includes('error') ||
    lower.includes('test')
  ) {
    const codingTask = createSubTask(
      'coder',
      `Based on the research, implement fixes for: ${goal}`,
      [researchTask.id],
    );
    tasks.push(codingTask);
    const testTask = createSubTask(
      'tester',
      'Run the test suite and verify all tests pass',
      [codingTask.id],
    );
    tasks.push(testTask);
    const reviewTask = createSubTask(
      'reviewer',
      'Review the changes and confirm they are correct',
      [testTask.id],
    );
    tasks.push(reviewTask);
  } else if (
    lower.includes('build') ||
    lower.includes('implement') ||
    lower.includes('create') ||
    lower.includes('add')
  ) {
    const codingTask = createSubTask('coder', `Implement the feature: ${goal}`, [researchTask.id]);
    tasks.push(codingTask);
    const testTask = createSubTask(
      'tester',
      'Write and run tests for the new feature',
      [codingTask.id],
    );
    tasks.push(testTask);
  } else if (lower.includes('document') || lower.includes('docs')) {
    const docTask = createSubTask('documenter', `Write documentation for: ${goal}`, [
      researchTask.id,
    ]);
    tasks.push(docTask);
  }

  return { goal, subTasks: tasks };
}

export function getToolsForRole(role: string): string[] {
  return ROLE_TOOLS[role] ?? ['filesystem.read', 'filesystem.search', 'shell.execute'];
}
