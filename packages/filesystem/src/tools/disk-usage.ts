import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute, formatBytes, normalizePath } from '../utils/path.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', '.venv']);

const schema = z.object({
  path: z.string().min(1),
  topN: z.number().int().positive().max(50).optional().default(10),
});

type Input = z.infer<typeof schema>;

interface DirSize {
  path: string;
  bytes: number;
}

async function sumDirectory(dir: string, depth = 0): Promise<number> {
  if (depth > 10) return 0; // limit recursion depth
  let total = 0;
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (!SKIP_DIRS.has(item.name)) {
          total += await sumDirectory(fullPath, depth + 1);
        }
      } else {
        try {
          const stat = await fs.stat(fullPath);
          total += stat.size;
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return total;
}

export const diskUsageTool = {
  name: 'filesystem.diskUsage',
  description: 'Calculate total disk usage of a directory and show largest subdirectories',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      const items = await fs.readdir(absPath, { withFileTypes: true });

      const dirSizes: DirSize[] = [];
      let totalBytes = 0;

      for (const item of items) {
        if (item.isDirectory()) {
          const fp = normalizePath(path.join(absPath, item.name));
          const bytes = await sumDirectory(fp);
          totalBytes += bytes;
          dirSizes.push({ path: fp, bytes });
        } else {
          try {
            const stat = await fs.stat(path.join(absPath, item.name));
            totalBytes += stat.size;
          } catch {
            // skip
          }
        }
      }

      dirSizes.sort((a, b) => b.bytes - a.bytes);
      const topDirectories = dirSizes.slice(0, input.topN).map(d => ({
        path: d.path,
        bytes: d.bytes,
        human: formatBytes(d.bytes),
      }));

      return {
        success: true,
        output: {
          path: absPath,
          totalBytes,
          totalHuman: formatBytes(totalBytes),
          topDirectories,
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
