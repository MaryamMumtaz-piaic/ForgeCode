import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface WorkspaceContext {
  cwd: string;
  workspaceName: string;
  gitBranch?: string;
  gitChangedFiles?: number;
  projectType?: string;
  packageManager?: string;
  nodeVersion?: string;
  isGitRepo: boolean;
}

export async function detectContext(cwd: string): Promise<WorkspaceContext> {
  const workspaceName = path.basename(cwd) || cwd;
  const ctx: WorkspaceContext = { cwd, workspaceName, isGitRepo: false };

  await Promise.all([
    detectGit(cwd, ctx),
    detectProject(cwd, ctx),
    detectNode(ctx),
  ]);

  return ctx;
}

async function detectGit(cwd: string, ctx: WorkspaceContext): Promise<void> {
  try {
    const { stdout: branch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      reject: false,
    });
    if (branch.trim() && branch.trim() !== 'HEAD') {
      ctx.isGitRepo = true;
      ctx.gitBranch = branch.trim();
    }
    const { stdout: status } = await execa('git', ['status', '--porcelain'], {
      cwd,
      reject: false,
    });
    ctx.gitChangedFiles = status.split('\n').filter(Boolean).length;
  } catch {
    // not a git repo
  }
}

async function detectProject(cwd: string, ctx: WorkspaceContext): Promise<void> {
  try {
    const pkgPath = path.join(cwd, 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const deps = { ...(pkg['dependencies'] as Record<string, unknown>), ...(pkg['devDependencies'] as Record<string, unknown>) };
    if (deps['next']) ctx.projectType = 'Next.js';
    else if (deps['react']) ctx.projectType = 'React';
    else if (deps['express'] || deps['fastify'] || deps['hono']) ctx.projectType = 'Node API';
    else ctx.projectType = 'Node.js';
  } catch {
    try {
      await fs.access(path.join(cwd, 'pyproject.toml'));
      ctx.projectType = 'Python';
    } catch {
      try {
        await fs.access(path.join(cwd, 'Cargo.toml'));
        ctx.projectType = 'Rust';
      } catch {
        // unknown
      }
    }
  }

  // Package manager detection
  try {
    await fs.access(path.join(cwd, 'pnpm-lock.yaml'));
    ctx.packageManager = 'pnpm';
    return;
  } catch {}
  try {
    await fs.access(path.join(cwd, 'yarn.lock'));
    ctx.packageManager = 'yarn';
    return;
  } catch {}
  try {
    await fs.access(path.join(cwd, 'package-lock.json'));
    ctx.packageManager = 'npm';
  } catch {}
}

async function detectNode(ctx: WorkspaceContext): Promise<void> {
  try {
    const { stdout } = await execa('node', ['--version'], { reject: false });
    ctx.nodeVersion = stdout.trim().replace('v', '');
  } catch {}
}

export function getHomeDirLabel(cwd: string): string {
  const home = os.homedir();
  if (cwd.startsWith(home)) {
    return '~' + cwd.slice(home.length);
  }
  return cwd;
}
