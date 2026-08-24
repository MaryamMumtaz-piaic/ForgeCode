export type RiskLevel = 'SAFE' | 'APPROVAL' | 'HIGH_RISK';

const HIGH_RISK_PATTERNS: RegExp[] = [
  /Remove-Item\s+.*-Recurse/i,
  /rm\s+-rf/i,
  /rmdir\s+.*\/s/i,
  /format\s+[a-z]:/i,
  /reg\s+(add|delete|import)/i,
  /net\s+(user|localgroup)/i,
  /git\s+push.*--force/i,
  /git\s+reset\s+--hard/i,
  /del\s+\/[sf]/i,
  /Stop-Service/i,
  /Set-ExecutionPolicy/i,
  /diskpart/i,
];

const APPROVAL_PATTERNS: RegExp[] = [
  /git\s+commit/i,
  /git\s+push(?!.*--force)/i,
  /git\s+merge/i,
  /git\s+stash/i,
  /npm\s+publish/i,
  /pnpm\s+publish/i,
  /docker\s+push/i,
  /kubectl\s+apply/i,
  /kubectl\s+delete/i,
  /Remove-Item(?!\s+.*-Recurse)/i,
  /del\s+/i,
  /pip\s+install/i,
  /npm\s+install/i,
  /pnpm\s+install/i,
];

export function classifyCommand(command: string): RiskLevel {
  if (HIGH_RISK_PATTERNS.some(p => p.test(command))) return 'HIGH_RISK';
  if (APPROVAL_PATTERNS.some(p => p.test(command))) return 'APPROVAL';
  return 'SAFE';
}
