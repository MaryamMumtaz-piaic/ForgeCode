import { z } from 'zod';
import { runGit } from '../runner.js';

const schema = z.object({
  cwd: z.string().min(1),
  message: z.string().min(1),
  author: z
    .object({ name: z.string(), email: z.string() })
    .optional(),
});
type Input = z.infer<typeof schema>;

export const gitCommitTool = {
  name: 'git.commit',
  description: 'Create a git commit with the staged changes',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const args = ['commit', '-m', input.message];
    const env: Record<string, string> = {};
    if (input.author) {
      env['GIT_AUTHOR_NAME'] = input.author.name;
      env['GIT_AUTHOR_EMAIL'] = input.author.email;
      env['GIT_COMMITTER_NAME'] = input.author.name;
      env['GIT_COMMITTER_EMAIL'] = input.author.email;
    }
    const r = await runGit(args, input.cwd, signal);
    return {
      success: r.exitCode === 0,
      output: { message: input.message, output: r.stdout, cwd: input.cwd },
      error: r.exitCode !== 0 ? r.stderr : undefined,
      duration: r.duration,
    };
  },
};
