import fs from 'fs/promises';
import path from 'path';
import { ProjectInfo } from './types.js';

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readJson(p: string): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch { return {}; }
}

function detectPackageManager(cwd: string, pkg: Record<string, unknown>): string {
  // Check lock files — most reliable indicator
  // Lock file check is async; defer to package.json engines/packageManager field below
  const engines = (pkg['engines'] as Record<string, unknown>) ?? {};
  if ('pnpm' in engines) return 'pnpm';
  if ('yarn' in engines) return 'yarn';
  if ((pkg['packageManager'] as string | undefined)?.startsWith('pnpm')) return 'pnpm';
  if ((pkg['packageManager'] as string | undefined)?.startsWith('yarn')) return 'yarn';
  return 'npm';
}

function detectFramework(pkg: Record<string, unknown>): string | undefined {
  const deps = {
    ...((pkg['dependencies'] as Record<string, unknown>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, unknown>) ?? {}),
  };
  if ('next' in deps) return 'Next.js';
  if ('nuxt' in deps) return 'Nuxt';
  if ('astro' in deps) return 'Astro';
  if ('remix' in deps) return 'Remix';
  if ('@sveltejs/kit' in deps) return 'SvelteKit';
  if ('react' in deps) return 'React';
  if ('vue' in deps) return 'Vue';
  if ('express' in deps) return 'Express';
  if ('fastify' in deps) return 'Fastify';
  if ('hono' in deps) return 'Hono';
  if ('django' in deps) return 'Django';
  if ('fastapi' in deps) return 'FastAPI';
  return undefined;
}

function detectTestRunner(pkg: Record<string, unknown>): string | undefined {
  const deps = {
    ...((pkg['dependencies'] as Record<string, unknown>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, unknown>) ?? {}),
  };
  if ('vitest' in deps) return 'Vitest';
  if ('jest' in deps) return 'Jest';
  if ('mocha' in deps) return 'Mocha';
  if ('ava' in deps) return 'Ava';
  return undefined;
}

function detectLanguage(pkg: Record<string, unknown>, cwd: string): string {
  const deps = {
    ...((pkg['dependencies'] as Record<string, unknown>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, unknown>) ?? {}),
  };
  if ('typescript' in deps) return 'TypeScript';
  return 'JavaScript';
}

export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = await readJson(pkgPath);
  const hasPkg = Object.keys(pkg).length > 0;

  const [hasGit, hasDocker, hasPyproject, hasCompose] = await Promise.all([
    exists(path.join(cwd, '.git')),
    exists(path.join(cwd, 'Dockerfile')),
    exists(path.join(cwd, 'pyproject.toml')),
    exists(path.join(cwd, 'docker-compose.yml')).then(r => r || exists(path.join(cwd, 'docker-compose.yaml'))),
  ]);

  const configFiles: string[] = [];
  const candidates = [
    'tsconfig.json', 'vite.config.ts', 'vite.config.js',
    'next.config.js', 'next.config.ts', 'tailwind.config.js',
    'tailwind.config.ts', '.eslintrc.json', 'eslint.config.js',
    'drizzle.config.ts', 'prisma/schema.prisma',
    'Dockerfile', 'docker-compose.yml', '.env.example',
  ];
  await Promise.all(
    candidates.map(async f => {
      if (await exists(path.join(cwd, f))) configFiles.push(f);
    }),
  );

  const entryPoints: string[] = [];
  const entryCandidates = [
    'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
    'src/app.ts', 'src/app.js', 'index.ts', 'index.js',
    'src/index.tsx', 'app/page.tsx', 'pages/index.tsx',
  ];
  await Promise.all(
    entryCandidates.map(async f => {
      if (await exists(path.join(cwd, f))) entryPoints.push(f);
    }),
  );

  let language = 'Unknown';
  if (hasPkg) language = detectLanguage(pkg, cwd);
  else if (hasPyproject) language = 'Python';

  return {
    cwd,
    framework: hasPkg ? detectFramework(pkg) : undefined,
    language,
    packageManager: hasPkg ? detectPackageManager(cwd, pkg) : undefined,
    testRunner: hasPkg ? detectTestRunner(pkg) : undefined,
    buildTool: hasPkg ? (pkg['scripts'] as Record<string, string> | undefined)?.['build'] ? 'custom' : undefined : undefined,
    hasGit,
    hasDocker: hasDocker || hasCompose,
    entryPoints,
    configFiles,
  };
}

export function formatProjectSummary(info: ProjectInfo): string {
  const lines: string[] = ['Project detected:'];
  if (info.framework) lines.push(`  Framework:  ${info.framework}`);
  lines.push(`  Language:   ${info.language}`);
  if (info.packageManager) lines.push(`  Package:    ${info.packageManager}`);
  if (info.testRunner) lines.push(`  Tests:      ${info.testRunner}`);
  lines.push(`  Git:        ${info.hasGit ? '✓' : '✗'}`);
  if (info.hasDocker) lines.push(`  Docker:     ✓`);
  if (info.entryPoints.length) lines.push(`  Entry:      ${info.entryPoints[0]}`);
  return lines.join('\n');
}
