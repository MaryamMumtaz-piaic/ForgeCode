import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  branch: z.string().min(1),
  create: z.boolean().optional().default(false),
});
type Input = z.infer<typeof schema>;

export const gitCheckoutTool = {
  name: 'git.checkout',
  description: 'Switch to a branch, optionally creating it',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const args = ['checkout', ...(input.create ? ['-b'] : []), input.branch];
    const r = await runGit(args, input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { branch: input.branch, created: input.create, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
