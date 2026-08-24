import fs from 'fs/promises';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  recursive: z.boolean().optional().default(true),
});

type Input = z.infer<typeof schema>;

export const createDirectoryTool = {
  name: 'filesystem.createDirectory',
  description: 'Create a directory (and parent directories if needed)',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      await fs.mkdir(absPath, { recursive: input.recursive });
      return {
        success: true,
        output: { path: absPath, created: true },
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
