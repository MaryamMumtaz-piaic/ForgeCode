export class PermissionError extends Error {
  constructor(message: string, public readonly toolName: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class PermissionDeniedError extends PermissionError {
  constructor(toolName: string, reason: string) {
    super(`Permission denied for '${toolName}': ${reason}`, toolName);
    this.name = 'PermissionDeniedError';
  }
}

export class TaskCancelledError extends PermissionError {
  constructor(toolName: string) {
    super(`Task cancelled by user at tool: ${toolName}`, toolName);
    this.name = 'TaskCancelledError';
  }
}
