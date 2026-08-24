import { z } from 'zod';
import { execa } from 'execa';

const schema = z.object({
  contextPath: z.string().min(1).describe('Build context directory containing Dockerfile'),
  tag: z.string().min(1).describe('Image tag, e.g. myapp:latest'),
  dockerfile: z.string().optional().describe('Path to Dockerfile relative to context'),
  buildArgs: z.record(z.string()).optional(),
  timeout: z.number().int().positive().max(600_000).optional().default(300_000),
});

type Input = z.infer<typeof schema>;

export const dockerBuildTool = {
  name: 'docker.build',
  description: 'Build a Docker image from a Dockerfile',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const start = Date.now();
    try {
      const args = ['build', '-t', input.tag];
      if (input.dockerfile) args.push('-f', input.dockerfile);
      if (input.buildArgs) {
        for (const [k, v] of Object.entries(input.buildArgs)) {
          args.push('--build-arg', `${k}=${v}`);
        }
      }
      args.push(input.contextPath);

      const result = await execa('docker', args, {
        timeout: input.timeout,
        cancelSignal: signal as AbortSignal | undefined,
        reject: false,
      });

      return {
        success: result.exitCode === 0,
        output: { tag: input.tag, stdout: result.stdout, stderr: result.stderr },
        error: result.exitCode !== 0 ? result.stderr : undefined,
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
