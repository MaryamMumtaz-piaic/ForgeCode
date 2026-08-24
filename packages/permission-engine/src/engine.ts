import { randomUUID } from 'crypto';
import {
  ApprovalDecision,
  ApprovalHandler,
  ApprovalMode,
  ApprovalRequest,
  PermissionLevel,
  ToolInfo,
} from './types.js';
import { PermissionDeniedError, TaskCancelledError } from './errors.js';

export class PermissionEngine {
  private readonly sessionAllowlist = new Set<string>();

  constructor(
    private readonly mode: ApprovalMode,
    private readonly approvalHandler: ApprovalHandler,
  ) {}

  async check(tool: ToolInfo, input: unknown): Promise<boolean> {
    if (this.mode === ApprovalMode.READONLY) {
      if (tool.permission !== PermissionLevel.SAFE) {
        throw new PermissionDeniedError(tool.name, 'readonly mode is active');
      }
      return true;
    }

    if (this.mode === ApprovalMode.AUTO) {
      return true;
    }

    if (
      this.mode === ApprovalMode.BALANCED &&
      tool.permission === PermissionLevel.SAFE
    ) {
      return true;
    }

    if (this.sessionAllowlist.has(tool.name)) {
      return true;
    }

    const request: ApprovalRequest = {
      tool,
      input,
      riskLevel: tool.permission,
      requestId: randomUUID(),
    };

    const result = await this.approvalHandler(request);

    switch (result.decision) {
      case ApprovalDecision.ALLOW_ONCE:
        return true;

      case ApprovalDecision.ALLOW_SESSION:
        this.sessionAllowlist.add(tool.name);
        return true;

      case ApprovalDecision.DENY:
        throw new PermissionDeniedError(tool.name, 'user denied');

      case ApprovalDecision.CANCEL_TASK:
        throw new TaskCancelledError(tool.name);

      default: {
        const _exhaustive: never = result.decision;
        throw new Error(`Unknown decision: ${String(_exhaustive)}`);
      }
    }
  }

  clearSessionAllowlist(): void {
    this.sessionAllowlist.clear();
  }

  isSessionAllowed(toolName: string): boolean {
    return this.sessionAllowlist.has(toolName);
  }
}
