import { AgentTool, PermissionLevel } from './types.js';
import { ToolNotFoundError } from './errors.js';

export class ToolRegistry {
  private readonly tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): AgentTool {
    const tool = this.tools.get(name);
    if (!tool) throw new ToolNotFoundError(name);
    return tool;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): AgentTool[] {
    return [...this.tools.values()];
  }

  getByPermission(level: PermissionLevel): AgentTool[] {
    return this.getAll().filter(t => t.permission === level);
  }

  getNames(): string[] {
    return [...this.tools.keys()];
  }

  clear(): void {
    this.tools.clear();
  }

  size(): number {
    return this.tools.size;
  }
}
