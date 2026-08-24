import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute, normalizePath } from '../utils/path.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', '.venv', '__pycache__']);

const schema = z.object({
  path: z.string().min(1),
  recursive: z.boolean().optional().default(false),
  includeHidden: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

interface Entry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
  modified?: string;
}

async function walkDir(
  dirPath: string,
  recursive: boolean,
  includeHidden: boolean,
  entries: Entry[],
): Promise<void> {
  let items: Dirent[];
  try {
    items = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const item of items) {
    if (!includeHidden && item.name.startsWith('.')) continue;
    const fullPath = normalizePath(path.join(dirPath, item.name));

    if (item.isDirectory()) {
      entries.push({ name: item.name, path: fullPath, type: 'directory' });
      if (recursive && !SKIP_DIRS.has(item.name)) {
        await walkDir(fullPath, recursive, includeHidden, entries);
      }
    } else if (item.isSymbolicLink()) {
      entries.push({ name: item.name, path: fullPath, type: 'symlink' });
    } else {
      try {
        const stat = await fs.stat(fullPath);
        entries.push({
          name: item.name,
          path: fullPath,
          type: 'file',
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      } catch {
        entries.push({ name: item.name, path: fullPath, type: 'file' });
      }
    }
  }
}

export const listTool = {
  name: 'filesystem.list',
  description: 'List files and directories at a given path',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      const entries: Entry[] = [];
      await walkDir(absPath, input.recursive, input.includeHidden, entries);
      return {
        success: true,
        output: { entries, total: entries.length, path: absPath },
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
