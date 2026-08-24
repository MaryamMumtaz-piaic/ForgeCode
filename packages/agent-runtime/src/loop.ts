import { randomUUID } from 'crypto';
import { AgentConfig, AgentEvent, AgentState, AgentTask, TaskStep } from './types.js';

export interface LoopDependencies {
  generateCompletion(messages: unknown[], tools: unknown[], signal: AbortSignal): AsyncIterable<LoopEvent>;
  executeTool(name: string, input: unknown, signal: AbortSignal): Promise<unknown>;
  onEvent(event: AgentEvent): void;
}

export interface LoopEvent {
  type: 'text' | 'tool_call' | 'done' | 'usage';
  text?: string;
  toolName?: string;
  toolInput?: unknown;
  callId?: string;
  stopReason?: string;
  tokens?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export async function runAgentLoop(
  userRequest: string,
  systemPrompt: string,
  config: AgentConfig,
  deps: LoopDependencies,
  signal: AbortSignal,
): Promise<AgentTask> {
  const taskId = randomUUID();
  const task: AgentTask = {
    taskId,
    userRequest,
    state: AgentState.THINKING,
    steps: [],
    startedAt: new Date(),
    totalTokens: 0,
    totalToolCalls: 0,
  };

  const messages: Message[] = [{ role: 'user', content: userRequest }];

  const emit = (event: Omit<AgentEvent, 'taskId'>) =>
    deps.onEvent({ ...event, taskId });

  emit({ type: 'state_change', state: AgentState.THINKING });

  const deadline = Date.now() + config.maxExecutionTimeMs;
  let stepNumber = 0;

  try {
    while (stepNumber < config.maxSteps && task.totalToolCalls < config.maxToolCalls) {
      if (signal.aborted || Date.now() > deadline) {
        task.state = signal.aborted ? AgentState.CANCELLED : AgentState.FAILED;
        task.error = signal.aborted ? 'Cancelled by user' : 'Execution time limit reached';
        break;
      }

      const step: TaskStep = {
        stepNumber: ++stepNumber,
        state: AgentState.THINKING,
        startedAt: new Date(),
      };
      task.steps.push(step);

      let assistantText = '';
      let pendingToolName: string | undefined;
      let pendingToolInput: unknown;
      let pendingCallId: string | undefined;
      let stopReason = 'end_turn';

      for await (const event of deps.generateCompletion(
        [{ role: 'system', content: systemPrompt }, ...messages],
        [],
        signal,
      )) {
        if (signal.aborted) break;

        if (event.type === 'text' && event.text) {
          assistantText += event.text;
          emit({ type: 'text_delta', delta: event.text });
        } else if (event.type === 'tool_call') {
          pendingToolName = event.toolName;
          pendingToolInput = event.toolInput;
          pendingCallId = event.callId;
          task.state = AgentState.EXECUTING;
          emit({ type: 'state_change', state: AgentState.EXECUTING });
        } else if (event.type === 'usage' && event.tokens) {
          task.totalTokens += event.tokens;
        } else if (event.type === 'done') {
          stopReason = event.stopReason ?? 'end_turn';
        }
      }

      if (assistantText) {
        messages.push({ role: 'assistant', content: assistantText });
      }

      if (stopReason === 'end_turn' || !pendingToolName) {
        // Agent is done
        step.state = AgentState.COMPLETED;
        step.completedAt = new Date();
        step.durationMs = step.completedAt.getTime() - step.startedAt.getTime();
        task.state = AgentState.COMPLETED;
        task.result = assistantText;
        break;
      }

      // Execute tool
      if (pendingToolName) {
        step.toolName = pendingToolName;
        step.toolInput = pendingToolInput;
        task.totalToolCalls++;

        emit({ type: 'tool_start', toolName: pendingToolName, toolInput: pendingToolInput });

        let toolOutput: unknown;
        try {
          toolOutput = await deps.executeTool(pendingToolName, pendingToolInput, signal);
        } catch (err) {
          toolOutput = { error: err instanceof Error ? err.message : String(err) };
        }

        step.toolOutput = toolOutput;
        step.state = AgentState.VERIFYING;
        step.completedAt = new Date();
        step.durationMs = step.completedAt.getTime() - step.startedAt.getTime();

        emit({ type: 'tool_end', toolName: pendingToolName, toolOutput, stepNumber });

        const toolOutputStr =
          typeof toolOutput === 'string'
            ? toolOutput
            : JSON.stringify(toolOutput, null, 2);

        messages.push({ role: 'assistant', content: assistantText || `[Using tool: ${pendingToolName}]` });
        messages.push({
          role: 'tool',
          content: toolOutputStr,
          toolCallId: pendingCallId,
          name: pendingToolName,
        });

        task.state = AgentState.THINKING;
        emit({ type: 'state_change', state: AgentState.THINKING });
      }
    }

    if (stepNumber >= config.maxSteps) {
      task.state = AgentState.FAILED;
      task.error = `Reached maximum steps limit (${config.maxSteps})`;
    }
  } catch (err) {
    task.state = AgentState.FAILED;
    task.error = err instanceof Error ? err.message : String(err);
    emit({ type: 'error', error: task.error });
  } finally {
    task.completedAt = new Date();
    emit({ type: 'task_complete', result: task.result, state: task.state });
  }

  return task;
}
