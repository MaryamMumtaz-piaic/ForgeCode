import { z } from 'zod';
import { execa } from 'execa';

const schema = z.object({
  image: z.string().min(1).describe('Docker image to use, e.g. node:20-alpine'),
  command: z.string().min(1).describe('Command to run inside the container'),
  workdir: z.string().optional().describe('Working directory inside container'),
  mountCwd: z.boolean().optional().default(false).describe('Mount current working directory into /workspace'),
  cwd: z.string().optional().describe('Host directory to mount (if mountCwd is true)'),
  env: z.record(z.string()).optional().describe('Environment variables to pass to container'),
  timeout: z.number().int().positive().max(300_000).optional().default(60_000),
  readonly: z.boolean().optional().default(false).describe('Mount host dir as read-only'),
});

type Input = z.infer<typeof schema>;

export const dockerRunTool = {
  name: 'docker.run',
  description: 'Run a command inside a Docker container for isolated, sandboxed execution',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const start = Date.now();
    try {
      const args = ['run', '--rm'];

      // Mount cwd
      if (input.mountCwd && input.cwd) {
        const mount = input.readonly
          ? `${input.cwd}:/workspace:ro`
          : `${input.cwd}:/workspace`;
        args.push('-v', mount);
      }

      // Working directory
      args.push('-w', input.workdir ?? '/workspace');

      // Environment variables
      if (input.env) {
        for (const [k, v] of Object.entries(input.env)) {
          args.push('-e', `${k}=${v}`);
        }
      }

      // Resource limits (security best practice)
      args.push('--memory', '512m');
      args.push('--cpus', '1');
      args.push('--network', 'none'); // no network by default for sandboxing

      args.push(input.image);
      args.push('sh', '-c', input.command);

      const result = await execa('docker', args, {
        timeout: input.timeout,
        cancelSignal: signal as AbortSignal | undefined,
        reject: false,
      });

      return {
        success: result.exitCode === 0,
        output: {
          image: input.image,
          command: input.command,
          exitCode: result.exitCode ?? -1,
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          duration: Date.now() - start,
        },
        error: result.exitCode !== 0 ? `Exit code ${result.exitCode}` : undefined,
        duration: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
      };
    }
  },
};
