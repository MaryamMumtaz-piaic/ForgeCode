import { z } from 'zod';
import { execa } from 'execa';

const schema = z.object({ all: z.boolean().optional().default(false) });
type Input = z.infer<typeof schema>;

export const dockerPsTool = {
  name: 'docker.ps',
  description: 'List Docker containers',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input, signal?: AbortSignal) {
    const start = Date.now();
    const result = await execa('docker', ['ps', '--format', 'json', ...(input.all ? ['-a'] : [])], {
      reject: false,
      cancelSignal: signal as AbortSignal | undefined,
    });
    return {
      success: result.exitCode === 0,
      output: { containers: result.stdout },
      error: result.exitCode !== 0 ? result.stderr : undefined,
      duration: Date.now() - start,
    };
  },
};
