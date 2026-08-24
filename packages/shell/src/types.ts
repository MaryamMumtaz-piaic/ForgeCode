import { z } from 'zod';

export enum ShellType {
  POWERSHELL = 'powershell',
  CMD = 'cmd',
  GIT_BASH = 'gitbash',
}

export const shellExecuteSchema = z.object({
  command: z.string().min(1, 'Command cannot be empty'),
  cwd: z.string().optional(),
  shell: z.nativeEnum(ShellType).optional(),
  timeout: z.number().int().positive().max(600_000).optional(),
  env: z.record(z.string()).optional(),
});

export type ShellExecuteInput = z.infer<typeof shellExecuteSchema>;

export interface ShellExecuteOutput {
  command: string;
  cwd: string;
  shell: ShellType;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
  cancelled: boolean;
}
