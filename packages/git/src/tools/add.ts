import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  paths: z.array(z.string()).min(1),
});
type Input = z.infer<typeof schema>;

export const gitAddTool = {
  name: 'git.add',
  description: 'Stage files for commit',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const r = await runGit(['add', '--', ...input.paths], input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { staged: input.paths, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
