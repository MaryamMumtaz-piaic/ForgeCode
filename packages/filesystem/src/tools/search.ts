import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute, normalizePath } from '../utils/path.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', '.venv', '__pycache__']);

const schema = z.object({
  directory: z.string().min(1),
  pattern: z.string().optional(),
  contentPattern: z.string().optional(),
  extensions: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().max(1000).optional().default(100),
  recursive: z.boolean().optional().default(true),
});

type Input = z.infer<typeof schema>;

interface Match {
  path: string;
  matchedLine?: string;
  lineNumber?: number;
}

async function collectFiles(
  dir: string,
  recursive: boolean,
  extensions?: string[],
  namePattern?: RegExp,
  results: string[] = [],
  maxResults = 100,
): Promise<void> {
  if (results.length >= maxResults) return;
  let items: Dirent[];
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const item of items) {
    if (results.length >= maxResults) break;
    const fullPath = normalizePath(path.join(dir, item.name));
    if (item.isDirectory()) {
      if (recursive && !SKIP_DIRS.has(item.name)) {
        await collectFiles(fullPath, recursive, extensions, namePattern, results, maxResults);
      }
    } else if (item.isFile()) {
      if (extensions && extensions.length > 0) {
        const ext = path.extname(item.name).toLowerCase();
        if (!extensions.includes(ext)) continue;
      }
      if (namePattern && !namePattern.test(item.name)) continue;
      results.push(fullPath);
    }
  }
}

export const searchTool = {
  name: 'filesystem.search',
  description: 'Search for files by name pattern or content pattern in a directory',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absDir = ensureAbsolute(input.directory);
      const namePattern = input.pattern ? new RegExp(input.pattern, 'i') : undefined;
      const contentRe = input.contentPattern
        ? new RegExp(input.contentPattern, 'im')
        : undefined;

      const filePaths: string[] = [];
      await collectFiles(
        absDir,
        input.recursive,
        input.extensions,
        namePattern,
        filePaths,
        input.maxResults,
      );

      const matches: Match[] = [];

      if (contentRe) {
        for (const fp of filePaths) {
          if (matches.length >= input.maxResults) break;
          try {
            const content = await fs.readFile(fp, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (contentRe.test(lines[i]!)) {
                matches.push({ path: fp, matchedLine: lines[i], lineNumber: i + 1 });
                break;
              }
            }
          } catch {
            // skip unreadable files
          }
        }
      } else {
        for (const fp of filePaths) {
          matches.push({ path: fp });
        }
      }

      return {
        success: true,
        output: { matches, total: matches.length, directory: absDir },
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
