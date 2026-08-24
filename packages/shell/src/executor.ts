import { execa } from 'execa';
import { ShellExecuteInput, ShellExecuteOutput, ShellType } from './types.js';

interface ShellConfig {
  bin: string;
  args: string[];
}

function getShellConfig(shell: ShellType): ShellConfig {
  switch (shell) {
    case ShellType.POWERSHELL:
      return { bin: 'powershell.exe', args: ['-NonInteractive', '-Command'] };
    case ShellType.CMD:
      return { bin: 'cmd.exe', args: ['/c'] };
    case ShellType.GIT_BASH:
      return { bin: 'bash.exe', args: ['-c'] };
    default: {
      const _exhaustive: never = shell;
      throw new Error(`Unknown shell: ${String(_exhaustive)}`);
    }
  }
}

// Strip API keys and secrets from env before logging/returning
function sanitizeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(env)) {
    if (/key|secret|token|password|credential|api_key/i.test(k)) {
      sanitized[k] = '[REDACTED]';
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export async function executeCommand(
  input: ShellExecuteInput,
  signal?: AbortSignal,
): Promise<ShellExecuteOutput> {
  const shell = input.shell ?? ShellType.POWERSHELL;
  const cwd = input.cwd ?? process.cwd();
  const timeout = input.timeout ?? 120_000;
  const start = Date.now();

  const { bin, args } = getShellConfig(shell);
  const mergedEnv = { ...process.env, ...input.env };

  try {
    const result = await execa(bin, [...args, input.command], {
      cwd,
      timeout,
      cancelSignal: signal as AbortSignal | undefined,
      env: mergedEnv,
      reject: false,
    });

    return {
      command: input.command,
      cwd,
      shell,
      exitCode: result.exitCode ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      duration: Date.now() - start,
      timedOut: result.timedOut ?? false,
      cancelled: signal?.aborted ?? false,
    };
  } catch (err) {
    return {
      command: input.command,
      cwd,
      shell,
      exitCode: -1,
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
      timedOut: false,
      cancelled: signal?.aborted ?? false,
    };
  }
}
