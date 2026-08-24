import fs from 'fs/promises';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  recursive: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

export const deleteTool = {
  name: 'filesystem.delete',
  description:
    'Permanently delete a file or directory. HIGH_RISK — always requires explicit user confirmation.',
  inputSchema: schema,
  permission: 'HIGH_RISK' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      await fs.rm(absPath, { recursive: input.recursive, force: true });
      return {
        success: true,
        output: { path: absPath, deleted: true },
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
