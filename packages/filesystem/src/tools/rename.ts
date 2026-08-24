import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute, normalizePath } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  newName: z.string().min(1),
});

type Input = z.infer<typeof schema>;

export const renameTool = {
  name: 'filesystem.rename',
  description: 'Rename a file or directory (stays in the same parent directory)',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const oldPath = ensureAbsolute(input.path);
      const dir = path.dirname(oldPath);
      const newPath = normalizePath(path.join(dir, input.newName));
      await fs.rename(oldPath, newPath);
      return {
        success: true,
        output: { oldPath, newPath },
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
