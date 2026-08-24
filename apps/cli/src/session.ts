import { randomUUID } from 'crypto';
import { execa } from 'execa';
import { runAgentLoop, AgentState, buildSystemPrompt } from '@forgecode/agent-runtime';
import { createProviderFromEnv } from '@forgecode/ai-provider';
import { ToolRegistry, ToolExecutor } from '@forgecode/tool-runtime';
import { PermissionEngine, ApprovalMode } from '@forgecode/permission-engine';
import { getAllFilesystemTools } from '@forgecode/filesystem';
import { getAllShellTools } from '@forgecode/shell';
import { getAllGitTools } from '@forgecode/git';
import type { ApprovalAnswer, ApprovalRequest } from './components/ApprovalPrompt.js';

export interface RunCallbacks {
  signal: AbortSignal;
  onStateChange(state: AgentState): void;
  onTextDelta(delta: string): void;
  onToolStart(id: string, name: string, input?: unknown): void;
  onToolEnd(id: string, name: string, durationMs: number, success: boolean, output?: unknown): void;
  onTokens(count: number): void;
  onComplete(result?: string): void;
  onError(error: string): void;
  requestApproval(request: ApprovalRequest): Promise<ApprovalAnswer>;
}

export class ForgeSession {
  private readonly registry: ToolRegistry;

  constructor(
    private readonly cwd: string,
    private readonly model: string,
    private readonly approvalMode: ApprovalMode = ApprovalMode.BALANCED,
  ) {
    this.registry = new ToolRegistry();
    for (const tool of [
      ...getAllFilesystemTools(),
      ...getAllShellTools(),
      ...getAllGitTools(),
    ]) {
      this.registry.register(tool as never);
    }
  }

  async runShell(command: string, callbacks: RunCallbacks): Promise<void> {
    const id = `shell-${Date.now()}`;
    callbacks.onStateChange(AgentState.EXECUTING);
    callbacks.onToolStart(id, command, { command });
    const start = Date.now();
    try {
      const result = await execa('powershell.exe', ['-NonInteractive', '-Command', command], {
        cwd: this.cwd,
        reject: false,
        cancelSignal: callbacks.signal as AbortSignal,
        timeout: 120_000,
      });
      const duration = Date.now() - start;
      const output = [
        result.stdout,
        result.stderr ? `STDERR: ${result.stderr}` : '',
        `Exit: ${result.exitCode}`,
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      ].filter(Boolean).join('\n');
      callbacks.onToolEnd(id, command, duration, (result.exitCode ?? 1) === 0, { output, exitCode: result.exitCode });
      callbacks.onStateChange(AgentState.COMPLETED);
      callbacks.onComplete(output);
    } catch (err) {
      const duration = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      callbacks.onToolEnd(id, command, duration, false, { error: msg });
      callbacks.onStateChange(AgentState.FAILED);
      callbacks.onError(msg);
    }
  }

  async run(userRequest: string, callbacks: RunCallbacks): Promise<void> {
    const permEngine = new PermissionEngine(this.approvalMode, async req => {
      const answer = await callbacks.requestApproval({
        toolName: req.tool.name,
        riskLevel: req.riskLevel,
        description: req.tool.description,
        input: req.input,
      });
      const decisionMap: Record<ApprovalAnswer, 'allow_once' | 'allow_session' | 'deny' | 'cancel_task'> = {
        allow_once: 'allow_once',
        allow_session: 'allow_session',
        deny: 'deny',
        cancel: 'cancel_task',
      };
      return { requestId: req.requestId, decision: decisionMap[answer] as never };
    });

    const executor = new ToolExecutor(this.registry, async (tool, input) => {
      return permEngine.check({ name: tool.name, description: tool.description, permission: tool.permission }, input);
    });

    const systemPrompt = buildSystemPrompt(this.cwd);

    const toolDefs = this.registry.getAll().map(t => ({
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties: {}, additionalProperties: true },
    }));

    await runAgentLoop(
      userRequest,
      systemPrompt,
      {
        model: this.model,
        maxSteps: 50,
        maxToolCalls: 100,
        maxExecutionTimeMs: 30 * 60 * 1000,
      },
      {
        generateCompletion: async function* (messages: unknown[], _tools: unknown[], signal: AbortSignal) {
          const provider = createProviderFromEnv();
          for await (const event of provider.stream(
            { messages: messages as never, tools: toolDefs },
            signal,
          )) {
            if (event.type === 'text_delta') yield { type: 'text' as const, text: event.delta };
            else if (event.type === 'tool_call_end') {
              yield {
                type: 'tool_call' as const,
                toolName: event.toolName,
                toolInput: event.arguments,
                callId: event.callId,
              };
            } else if (event.type === 'usage') {
              yield { type: 'usage' as const, tokens: event.totalTokens };
            } else if (event.type === 'done') {
              yield { type: 'done' as const, stopReason: event.stopReason };
            }
          }
        },

        async executeTool(name, input, signal) {
          const callId = randomUUID();
          const start = Date.now();
          callbacks.onToolStart(callId, name, input);
          const result = await executor.execute(name, input, signal);
          const dur = Date.now() - start;
          callbacks.onToolEnd(callId, name, dur, result.result.success, result.result.output);
          return result.result.output;
        },

        onEvent(event) {
          if (event.type === 'state_change' && event.state) {
            callbacks.onStateChange(event.state);
          } else if (event.type === 'text_delta' && event.delta) {
            callbacks.onTextDelta(event.delta);
          } else if (event.type === 'task_complete') {
            callbacks.onComplete(event.result);
          } else if (event.type === 'error') {
            callbacks.onError(event.error ?? 'Unknown error');
          }
        },
      },
      callbacks.signal,
    );
  }
}
