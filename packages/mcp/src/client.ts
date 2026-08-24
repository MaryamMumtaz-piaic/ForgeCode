import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServerConfig, McpTool, McpToolCallResult } from './types.js';

export class McpClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(private readonly config: McpServerConfig) {}

  async connect(): Promise<void> {
    if (!this.config.command) {
      throw new Error(`MCP server ${this.config.name} has no command configured`);
    }
    this.transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args ?? [],
      env: { ...process.env, ...this.config.env } as Record<string, string>,
    });
    this.client = new Client({ name: 'forgecode', version: '0.1.0' });
    await this.client.connect(this.transport);
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
    this.transport = null;
  }

  async listTools(): Promise<McpTool[]> {
    if (!this.client) throw new Error('Not connected');
    const response = await this.client.listTools();
    return response.tools.map(t => ({
      serverId: this.config.id,
      serverName: this.config.name,
      name: t.name,
      description: t.description ?? '',
      inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
    }));
  }

  async callTool(toolName: string, input: unknown): Promise<McpToolCallResult> {
    if (!this.client) throw new Error('Not connected');
    const result = await this.client.callTool({
      name: toolName,
      arguments: input as Record<string, unknown>,
    });
    return {
      content: result.content,
      isError: result.isError === true,
    };
  }
}
