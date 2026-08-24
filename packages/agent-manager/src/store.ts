import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { AgentDefinition, CreateAgentInput } from './types.js';

function getAgentsDir(): string {
  const dir = path.join(os.homedir(), '.forgecode', 'agents');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function agentPath(id: string): string {
  return path.join(getAgentsDir(), `${id}.json`);
}

interface StoredAgent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: string[];
  permissions: Record<string, boolean>;
  maxSteps: number;
  maxToolCalls: number;
  approvalMode: string;
  schedule?: unknown;
  createdAt: string;
  updatedAt: string;
}

function rowToAgent(raw: StoredAgent): AgentDefinition {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    instructions: raw.instructions,
    model: raw.model,
    tools: raw.tools,
    permissions: raw.permissions,
    maxSteps: raw.maxSteps,
    maxToolCalls: raw.maxToolCalls,
    approvalMode: raw.approvalMode as AgentDefinition['approvalMode'],
    schedule: raw.schedule as AgentDefinition['schedule'],
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export class AgentStore {
  create(input: CreateAgentInput): AgentDefinition {
    const now = new Date();
    const agent: AgentDefinition = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      instructions: input.instructions,
      model: input.model ?? 'gpt-4.1-mini',
      tools: input.tools ?? ['filesystem.*', 'shell.execute', 'git.*'],
      permissions: input.permissions ?? {},
      maxSteps: input.maxSteps ?? 50,
      maxToolCalls: input.maxToolCalls ?? 100,
      approvalMode: input.approvalMode ?? 'balanced',
      schedule: input.schedule,
      createdAt: now,
      updatedAt: now,
    };
    fs.writeFileSync(agentPath(agent.id), JSON.stringify(agent, null, 2), 'utf8');
    return agent;
  }

  getById(id: string): AgentDefinition | undefined {
    try {
      const raw = JSON.parse(fs.readFileSync(agentPath(id), 'utf8')) as StoredAgent;
      return rowToAgent(raw);
    } catch { return undefined; }
  }

  list(): AgentDefinition[] {
    try {
      const files = fs.readdirSync(getAgentsDir()).filter(f => f.endsWith('.json'));
      return files
        .map(f => {
          try {
            return rowToAgent(JSON.parse(fs.readFileSync(path.join(getAgentsDir(), f), 'utf8')) as StoredAgent);
          } catch { return null; }
        })
        .filter((a): a is AgentDefinition => a !== null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch { return []; }
  }

  update(id: string, updates: Partial<CreateAgentInput>): AgentDefinition | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const updated: AgentDefinition = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    fs.writeFileSync(agentPath(id), JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  delete(id: string): void {
    try { fs.unlinkSync(agentPath(id)); } catch { /* already gone */ }
  }
}
