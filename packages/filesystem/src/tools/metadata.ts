import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute, formatBytes } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
});

type Input = z.infer<typeof schema>;

export const metadataTool = {
  name: 'filesystem.metadata',
  description: 'Get metadata (size, type, dates) for a file or directory',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      const stat = await fs.stat(absPath);
      return {
        success: true,
        output: {
          path: absPath,
          type: stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : 'other',
          size: stat.size,
          sizeHuman: formatBytes(stat.size),
          created: stat.birthtime.toISOString(),
          modified: stat.mtime.toISOString(),
          accessed: stat.atime.toISOString(),
          extension: path.extname(absPath),
        },
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
