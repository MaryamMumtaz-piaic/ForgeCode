import { z } from 'zod';
import { McpClient } from './client.js';
import { McpTool, McpServerConfig } from './types.js';

export interface BridgedTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  permission: 'SAFE' | 'APPROVAL' | 'HIGH_RISK';
  execute(
    input: unknown,
    signal?: AbortSignal,
  ): Promise<{ success: boolean; output?: unknown; error?: string; duration: number }>;
}

export function bridgeMcpTool(client: McpClient, mcpTool: McpTool): BridgedTool {
  return {
    name: `mcp.${mcpTool.serverId}.${mcpTool.name}`,
    description: `[MCP:${mcpTool.serverName}] ${mcpTool.description}`,
    inputSchema: z.record(z.unknown()),
    permission: 'APPROVAL' as const,
    async execute(input: unknown) {
      const start = Date.now();
      try {
        const result = await client.callTool(mcpTool.name, input);
        return {
          success: !result.isError,
          output: result.content,
          error: result.isError ? String(result.content) : undefined,
          duration: Date.now() - start,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          duration: Date.now() - start,
        };
      }
    },
  };
}

export class McpBridge {
  private readonly clients = new Map<string, McpClient>();
  private readonly bridgedTools = new Map<string, BridgedTool>();

  async connectServer(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.id)) return;
    const client = new McpClient(config);
    await client.connect();
    this.clients.set(config.id, client);
    const tools = await client.listTools();
    for (const tool of tools) {
      this.bridgedTools.set(`mcp.${config.id}.${tool.name}`, bridgeMcpTool(client, tool));
    }
  }

  async disconnectAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect().catch(() => {});
    }
    this.clients.clear();
    this.bridgedTools.clear();
  }

  getAllTools(): BridgedTool[] {
    return [...this.bridgedTools.values()];
  }

  getConnectedServers(): string[] {
    return [...this.clients.keys()];
  }
}
