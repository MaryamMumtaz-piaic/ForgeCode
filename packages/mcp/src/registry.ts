import fs from 'fs';
import path from 'path';
import os from 'os';
import { McpServerConfig } from './types.js';

function getConfigPath(): string {
  const dir = path.join(os.homedir(), '.forgecode');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'mcp-servers.json');
}

export class McpRegistry {
  private load(): McpServerConfig[] {
    try {
      return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8')) as McpServerConfig[];
    } catch { return []; }
  }

  private save(servers: McpServerConfig[]): void {
    fs.writeFileSync(getConfigPath(), JSON.stringify(servers, null, 2), 'utf8');
  }

  list(): McpServerConfig[] {
    return this.load();
  }

  add(config: Omit<McpServerConfig, 'enabled'>): McpServerConfig {
    const servers = this.load();
    const server: McpServerConfig = { ...config, enabled: true };
    const existing = servers.findIndex(s => s.id === config.id);
    if (existing >= 0) servers[existing] = server;
    else servers.push(server);
    this.save(servers);
    return server;
  }

  remove(id: string): void {
    const servers = this.load().filter(s => s.id !== id);
    this.save(servers);
  }

  enable(id: string, enabled: boolean): void {
    const servers = this.load().map(s => s.id === id ? { ...s, enabled } : s);
    this.save(servers);
  }

  get(id: string): McpServerConfig | undefined {
    return this.load().find(s => s.id === id);
  }
}
