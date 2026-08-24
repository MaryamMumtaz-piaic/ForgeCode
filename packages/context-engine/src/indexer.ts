import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import _ignore from 'ignore';

interface IgnoreInstance { ignores(path: string): boolean; add(patterns: string | string[]): IgnoreInstance; }
type IgnoreFn = () => IgnoreInstance;
const ignore = _ignore as unknown as IgnoreFn;
import { FileEntry } from './types.js';

const DEFAULT_IGNORE = [
  'node_modules', '.git', 'dist', '.next', 'build', '.venv', '__pycache__',
  '*.min.js', '*.min.css', '*.map', '*.lock', 'package-lock.json',
  'pnpm-lock.yaml', 'yarn.lock', '.DS_Store', 'Thumbs.db',
];

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.cs', '.cpp', '.c', '.h',
  '.md', '.mdx', '.json', '.yaml', '.yml', '.toml', '.env.example',
  '.sql', '.graphql', '.prisma',
]);

async function loadIgnoreRules(cwd: string): Promise<IgnoreInstance> {
  const ig = ignore().add(DEFAULT_IGNORE);
  try {
    const gitignore = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    ig.add(gitignore);
  } catch { /* no .gitignore */ }
  return ig;
}

async function walkDir(
  dir: string,
  root: string,
  ig: IgnoreInstance,
  entries: FileEntry[],
  maxFiles: number,
): Promise<void> {
  if (entries.length >= maxFiles) return;
  let items: Dirent[];
  try { items = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return; }

  for (const item of items) {
    if (entries.length >= maxFiles) break;
    const fullPath = path.join(dir, item.name);
    const relPath = path.relative(root, fullPath).replace(/\\/g, '/');

    if (ig.ignores(relPath)) continue;

    if (item.isDirectory()) {
      await walkDir(fullPath, root, ig, entries, maxFiles);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.size > 500_000) continue; // skip files > 500KB
        entries.push({
          path: fullPath.replace(/\//g, '\\'),
          relativePath: relPath,
          extension: ext,
          sizeBytes: stat.size,
        });
      } catch { /* skip */ }
    }
  }
}

export async function indexDirectory(cwd: string, maxFiles = 500): Promise<FileEntry[]> {
  const ig = await loadIgnoreRules(cwd);
  const entries: FileEntry[] = [];
  await walkDir(cwd, cwd, ig, entries, maxFiles);
  return entries;
}

export async function readRelevantFiles(
  files: FileEntry[],
  query: string,
  maxFiles = 10,
  maxTokensPerFile = 2000,
): Promise<{ path: string; relativePath: string; content: string }[]> {
  // Simple relevance: prefer files whose names match query terms
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const scored = files.map(f => {
    const name = path.basename(f.relativePath).toLowerCase();
    const rel = f.relativePath.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (name.includes(term)) score += 3;
      else if (rel.includes(term)) score += 1;
    }
    // Prefer smaller files
    score -= f.sizeBytes / 100_000;
    return { file: f, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const results: { path: string; relativePath: string; content: string }[] = [];
  for (const { file } of scored.slice(0, maxFiles)) {
    try {
      let content = await fs.readFile(file.path, 'utf8');
      // Rough token estimate: 4 chars ≈ 1 token
      const maxChars = maxTokensPerFile * 4;
      if (content.length > maxChars) {
        content = content.slice(0, maxChars) + '\n... [truncated]';
      }
      results.push({ path: file.path, relativePath: file.relativePath, content });
    } catch { /* skip unreadable */ }
  }
  return results;
}
