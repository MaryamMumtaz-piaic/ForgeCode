import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({ cwd: z.string().min(1) });
type Input = z.infer<typeof schema>;

export const gitStatusTool = {
  name: 'git.status',
  description: 'Show the working tree status of a git repository',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const r = await runGit(['status', '--porcelain=v1', '--branch'], input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { raw: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
