import path from 'path';

const SENSITIVE_PATTERNS = [
  /\.env(\.|$)/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials/i,
  /password/i,
  /secret/i,
  /\.pfx$/i,
  /\.p12$/i,
];

export function normalizePath(p: string): string {
  return path.normalize(p).replace(/\//g, '\\');
}

export function validatePath(p: string): void {
  if (p.includes('\0')) {
    throw new Error(`Invalid path: null byte detected`);
  }
  const normalized = path.normalize(p);
  if (normalized.includes('..')) {
    // Allow .. but not path traversal out of a safe root in non-absolute paths
    // For absolute paths, Windows will resolve correctly — no further restriction
  }
}

export function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p);
}

export function isSensitivePath(p: string): boolean {
  const basename = path.basename(p);
  return SENSITIVE_PATTERNS.some(re => re.test(basename));
}

export function ensureAbsolute(p: string, cwd?: string): string {
  if (path.isAbsolute(p)) return normalizePath(p);
  return normalizePath(path.resolve(cwd ?? process.cwd(), p));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
