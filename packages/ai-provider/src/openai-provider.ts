import OpenAI from 'openai';
import type { AIProvider, AgentInput, ModelEvent, ModelResponse } from './types.js';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly defaultModel: string;
  private readonly client: OpenAI;

  constructor(apiKey: string, model: string = 'gpt-4.1-mini') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = model;
  }

  async *stream(input: AgentInput, signal?: AbortSignal): AsyncIterable<ModelEvent> {
    const messages = this.buildMessages(input);
    const tools = this.buildTools(input);

    const stream = await this.client.chat.completions.create(
      {
        model: input.model ?? this.defaultModel,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0,
      },
      { signal },
    );

    const pendingToolCalls = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: 'text_delta', delta: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!pendingToolCalls.has(tc.index)) {
            pendingToolCalls.set(tc.index, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
            yield { type: 'tool_call_start', callId: tc.id ?? String(tc.index), toolName: tc.function?.name ?? '' };
          }
          const pending = pendingToolCalls.get(tc.index)!;
          if (tc.id) pending.id = tc.id;
          if (tc.function?.name) pending.name = tc.function.name;
          if (tc.function?.arguments) {
            pending.args += tc.function.arguments;
            yield { type: 'tool_call_delta', callId: pending.id, argumentsDelta: tc.function.arguments };
          }
        }
      }

      if (chunk.usage) {
        yield {
          type: 'usage',
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    for (const [, tc] of pendingToolCalls) {
      let args: unknown;
      try { args = JSON.parse(tc.args); } catch { args = {}; }
      yield { type: 'tool_call_end', callId: tc.id, toolName: tc.name, arguments: args };
    }

    yield { type: 'done', stopReason: pendingToolCalls.size > 0 ? 'tool_use' : 'end_turn' };
  }

  async generate(input: AgentInput, signal?: AbortSignal): Promise<ModelResponse> {
    const messages = this.buildMessages(input);
    const tools = this.buildTools(input);

    const response = await this.client.chat.completions.create(
      {
        model: input.model ?? this.defaultModel,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0,
      },
      { signal },
    );

    const choice = response.choices[0];
    const content = choice?.message?.content ?? '';
    const toolCalls = (choice?.message?.tool_calls ?? []).map(tc => ({
      callId: tc.id,
      toolName: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as unknown,
    }));

    const finishReason = choice?.finish_reason;
    let stopReason: ModelResponse['stopReason'] = 'end_turn';
    if (finishReason === 'tool_calls') stopReason = 'tool_use';
    else if (finishReason === 'length') stopReason = 'max_tokens';

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      stopReason,
      model: response.model,
    };
  }

  private buildMessages(input: AgentInput): OpenAI.Chat.ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (input.systemPrompt) {
      result.push({ role: 'system', content: input.systemPrompt });
    }

    for (const msg of input.messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        result.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'tool' && msg.toolCallId) {
        result.push({ role: 'tool', tool_call_id: msg.toolCallId, content: msg.content });
      } else if (msg.role === 'system') {
        result.push({ role: 'system', content: msg.content });
      }
    }

    return result;
  }

  private buildTools(input: AgentInput): OpenAI.Chat.ChatCompletionTool[] {
    if (!input.tools?.length) return [];
    return input.tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }
}
