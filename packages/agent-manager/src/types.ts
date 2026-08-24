export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: string[];
  permissions: Record<string, boolean>;
  maxSteps: number;
  maxToolCalls: number;
  approvalMode: 'auto' | 'balanced' | 'strict' | 'readonly';
  schedule?: AgentSchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentSchedule {
  type: 'once' | 'interval' | 'cron' | 'watch';
  intervalMs?: number;
  cron?: string;
  watchPath?: string;
  runAt?: Date;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  instructions: string;
  model?: string;
  tools?: string[];
  permissions?: Record<string, boolean>;
  maxSteps?: number;
  maxToolCalls?: number;
  approvalMode?: AgentDefinition['approvalMode'];
  schedule?: AgentSchedule;
}

// Built-in agent roles
export const BUILTIN_AGENTS: Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'General Coding Agent',
    description: 'Build, fix, and maintain code across any project',
    instructions: 'You are an expert software engineer. Understand the codebase, fix bugs, add features, and write tests. Always run tests after making changes.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.*', 'shell.execute', 'git.*'],
    permissions: {},
    maxSteps: 50,
    maxToolCalls: 100,
    approvalMode: 'balanced',
  },
  {
    name: 'Code Reviewer',
    description: 'Review diffs and suggest improvements',
    instructions: 'You are a senior code reviewer. Analyze code for bugs, security issues, performance problems, and style violations. Be specific and constructive.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.read', 'filesystem.search', 'git.diff', 'git.log'],
    permissions: { 'filesystem.write': false, 'filesystem.edit': false },
    maxSteps: 20,
    maxToolCalls: 40,
    approvalMode: 'readonly',
  },
  {
    name: 'Debugging Agent',
    description: 'Diagnose and fix runtime errors',
    instructions: 'You are an expert debugger. Reproduce errors, analyze stack traces, locate root causes, and implement fixes. Run tests to verify fixes.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.*', 'shell.execute', 'git.*'],
    permissions: {},
    maxSteps: 40,
    maxToolCalls: 80,
    approvalMode: 'balanced',
  },
  {
    name: 'Test Fixer',
    description: 'Automatically fix failing tests',
    instructions: 'You are a testing expert. Run the test suite, analyze failures, locate the source of failures, fix the code or tests, and verify all tests pass.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.*', 'shell.execute', 'git.*'],
    permissions: {},
    maxSteps: 30,
    maxToolCalls: 60,
    approvalMode: 'balanced',
  },
  {
    name: 'Security Auditor',
    description: 'Audit repositories for security vulnerabilities',
    instructions: 'You are a security expert. Scan for SQL injection, XSS, exposed secrets, insecure dependencies, hardcoded credentials, and other vulnerabilities. Report findings with severity and remediation steps.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.read', 'filesystem.search', 'filesystem.list', 'shell.execute'],
    permissions: { 'filesystem.write': false, 'filesystem.edit': false, 'filesystem.delete': false },
    maxSteps: 30,
    maxToolCalls: 60,
    approvalMode: 'readonly',
  },
  {
    name: 'DevOps Agent',
    description: 'Manage deployments, CI/CD, Docker, and infrastructure',
    instructions: 'You are a DevOps engineer. Set up CI/CD pipelines, Docker containers, cloud deployments, and infrastructure as code. Always verify configurations before applying.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.*', 'shell.execute', 'git.*'],
    permissions: {},
    maxSteps: 40,
    maxToolCalls: 80,
    approvalMode: 'strict',
  },
  {
    name: 'Documentation Agent',
    description: 'Generate and update project documentation',
    instructions: 'You are a technical writer. Read the codebase and generate clear, accurate documentation. Update READMEs, add JSDoc comments, and create API references.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.read', 'filesystem.search', 'filesystem.write', 'filesystem.edit'],
    permissions: { 'filesystem.delete': false },
    maxSteps: 20,
    maxToolCalls: 40,
    approvalMode: 'balanced',
  },
  {
    name: 'File Organizer',
    description: 'Organize directories by type, date, and pattern',
    instructions: 'You are a file organization expert. Analyze directories, identify files that need organizing, and move them into logical structures. Always confirm before moving.',
    model: 'gpt-4.1-mini',
    tools: ['filesystem.list', 'filesystem.search', 'filesystem.metadata', 'filesystem.move', 'filesystem.createDirectory'],
    permissions: { 'filesystem.delete': false, 'filesystem.write': false },
    maxSteps: 20,
    maxToolCalls: 50,
    approvalMode: 'strict',
  },
];
