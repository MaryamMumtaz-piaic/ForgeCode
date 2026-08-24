import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  staged: z.boolean().optional().default(false),
  file: z.string().optional(),
});
type Input = z.infer<typeof schema>;

export const gitDiffTool = {
  name: 'git.diff',
  description: 'Show changes in the working tree or staged area',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const args = ['diff'];
    if (input.staged) args.push('--staged');
    if (input.file) args.push('--', input.file);
    const r = await runGit(args, input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { diff: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
