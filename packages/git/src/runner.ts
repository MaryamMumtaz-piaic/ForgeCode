import { execa } from 'execa';

export interface GitResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export async function runGit(
  args: string[],
  cwd: string,
  signal?: AbortSignal,
): Promise<GitResult> {
  const start = Date.now();
  try {
    const result = await execa('git', args, {
      cwd,
      reject: false,
      cancelSignal: signal as AbortSignal | undefined,
    });
    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.exitCode ?? 1,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      exitCode: -1,
      duration: Date.now() - start,
    };
  }
}
