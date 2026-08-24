export enum PermissionLevel {
  SAFE = 'SAFE',
  APPROVAL = 'APPROVAL',
  HIGH_RISK = 'HIGH_RISK',
}

export enum ApprovalMode {
  // Ask for APPROVAL and HIGH_RISK tools
  BALANCED = 'balanced',
  // Ask for every tool call
  STRICT = 'strict',
  // Auto-approve everything (no prompts) — dangerous
  AUTO = 'auto',
  // Never execute write operations
  READONLY = 'readonly',
}

export interface ToolInfo {
  name: string;
  description: string;
  permission: PermissionLevel;
}

export enum ApprovalDecision {
  ALLOW_ONCE = 'allow_once',
  ALLOW_SESSION = 'allow_session',
  DENY = 'deny',
  CANCEL_TASK = 'cancel_task',
}

export interface ApprovalRequest {
  tool: ToolInfo;
  input: unknown;
  riskLevel: PermissionLevel;
  requestId: string;
}

export interface ApprovalResult {
  requestId: string;
  decision: ApprovalDecision;
}

// The approval handler is provided by the UI layer
export type ApprovalHandler = (request: ApprovalRequest) => Promise<ApprovalResult>;
