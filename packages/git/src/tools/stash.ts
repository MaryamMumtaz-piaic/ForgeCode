import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  action: z.enum(['push', 'pop', 'list', 'drop']).default('push'),
  message: z.string().optional(),
});
type Input = z.infer<typeof schema>;

export const gitStashTool = {
  name: 'git.stash',
  description: 'Push, pop, list, or drop git stash entries',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const args = ['stash', input.action];
    if (input.action === 'push' && input.message) {
      args.push('-m', input.message);
    }
    const r = await runGit(args, input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { action: input.action, output: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
