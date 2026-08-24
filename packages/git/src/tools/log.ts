import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  maxCount: z.number().int().positive().max(100).optional().default(20),
  oneline: z.boolean().optional().default(true),
});
type Input = z.infer<typeof schema>;

export const gitLogTool = {
  name: 'git.log',
  description: 'Show recent commit history',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const format = input.oneline ? '--oneline' : '--format=%H|%an|%ae|%ai|%s';
    const r = await runGit(
      ['log', format, `-${input.maxCount}`],
      input.cwd,
      signal,
    );
    return {
      success: r.exitCode === 0,
      output: { log: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
