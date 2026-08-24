export class ToolError extends Error {
  constructor(message: string, public readonly toolName: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`, toolName);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolPermissionDeniedError extends ToolError {
  constructor(toolName: string) {
    super(`Permission denied for tool: ${toolName}`, toolName);
    this.name = 'ToolPermissionDeniedError';
  }
}

export class ToolValidationError extends ToolError {
  constructor(toolName: string, public readonly issues: unknown) {
    super(`Invalid input for tool: ${toolName}`, toolName);
    this.name = 'ToolValidationError';
  }
}

export class ToolExecutionError extends ToolError {
  constructor(toolName: string, cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Tool execution failed (${toolName}): ${msg}`, toolName);
    this.name = 'ToolExecutionError';
    this.cause = cause;
  }
}

export class ToolAbortedError extends ToolError {
  constructor(toolName: string) {
    super(`Tool aborted: ${toolName}`, toolName);
    this.name = 'ToolAbortedError';
  }
}
