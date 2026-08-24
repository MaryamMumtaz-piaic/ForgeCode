import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  all: z.boolean().optional().default(false),
});
type Input = z.infer<typeof schema>;

export const gitBranchTool = {
  name: 'git.branch',
  description: 'List branches in the repository',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const args = ['branch', '--format=%(refname:short)|%(upstream:short)|%(HEAD)'];
    if (input.all) args.push('-a');
    const r = await runGit(args, input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { branches: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
