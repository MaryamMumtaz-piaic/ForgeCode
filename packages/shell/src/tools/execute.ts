import { shellExecuteSchema, ShellExecuteInput } from '../types.js';
import { executeCommand } from '../executor.js';

export const shellExecuteTool = {
  name: 'shell.execute',
  description:
    'Execute a shell command in PowerShell (default), CMD, or Git Bash. Returns exit code, stdout, and stderr.',
  inputSchema: shellExecuteSchema,
  permission: 'APPROVAL' as const,

  async execute(input: ShellExecuteInput, signal?: AbortSignal) {
    const start = Date.now();
    try {
      const output = await executeCommand(input, signal);
      return {
        success: output.exitCode === 0,
        output,
        error:
          output.exitCode !== 0
            ? `Process exited with code ${output.exitCode}`
            : undefined,
        duration: output.duration,
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
