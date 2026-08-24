import { randomUUID } from 'crypto';
import { AgentTool, ToolCall, ToolCallResult } from './types.js';
import { ToolRegistry } from './registry.js';
import {
  ToolAbortedError,
  ToolExecutionError,
  ToolPermissionDeniedError,
  ToolValidationError,
} from './errors.js';

export type PermissionChecker = (tool: AgentTool, input: unknown) => Promise<boolean>;

export class ToolExecutor {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly checkPermission: PermissionChecker,
  ) {}

  async execute(
    toolName: string,
    rawInput: unknown,
    signal?: AbortSignal,
  ): Promise<ToolCallResult> {
    const tool = this.registry.get(toolName);

    const call: ToolCall = {
      callId: randomUUID(),
      toolName,
      input: rawInput,
      requestedAt: new Date(),
    };

    const startedAt = new Date();

    try {
      if (signal?.aborted) throw new ToolAbortedError(toolName);

      const parseResult = tool.inputSchema.safeParse(rawInput);
      if (!parseResult.success) {
        throw new ToolValidationError(toolName, parseResult.error.issues);
      }

      const allowed = await this.checkPermission(tool, parseResult.data);
      if (!allowed) throw new ToolPermissionDeniedError(toolName);

      if (signal?.aborted) throw new ToolAbortedError(toolName);

      const result = await tool.execute(parseResult.data, signal);

      return {
        call,
        result,
        startedAt,
        completedAt: new Date(),
      };
    } catch (err) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      if (
        err instanceof ToolPermissionDeniedError ||
        err instanceof ToolValidationError ||
        err instanceof ToolAbortedError
      ) {
        return {
          call,
          result: { success: false, error: err.message, duration },
          startedAt,
          completedAt,
        };
      }

      const wrapped = new ToolExecutionError(toolName, err);
      return {
        call,
        result: { success: false, error: wrapped.message, duration },
        startedAt,
        completedAt,
      };
    }
  }
}
