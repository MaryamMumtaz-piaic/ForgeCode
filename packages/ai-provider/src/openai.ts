import OpenAI from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions.js';
import type { Stream } from 'openai/streaming.js';
import {
  ProviderAuthError,
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from './errors.js';
import type {
  AgentInput,
  AgentMessage,
  AIProvider,
  ModelEvent,
  ModelResponse,
  ToolCallRequest,
  ToolDefinition,
} from './types.js';

// ─── Config ─────────────────────────────────────────────────────────────────

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapFinishReason(
  reason: string | null | undefined,
): 'end_turn' | 'tool_use' | 'max_tokens' {
  switch (reason) {
    case 'tool_calls':
      return 'tool_use';
    case 'length':
      return 'max_tokens';
    default:
      return 'end_turn';
  }
}

function buildMessages(input: AgentInput): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];

  // Prepend system prompt if provided and not already in messages
  if (input.systemPrompt) {
    messages.push({ role: 'system', content: input.systemPrompt });
  }

  for (const msg of input.messages) {
    messages.push(toOpenAIMessage(msg));
  }

  return messages;
}

function toOpenAIMessage(msg: AgentMessage): ChatCompletionMessageParam {
  switch (msg.role) {
    case 'system':
      return { role: 'system', content: msg.content };
    case 'user':
      return { role: 'user', content: msg.content };
    case 'assistant':
      return { role: 'assistant', content: msg.content };
    case 'tool':
      if (!msg.toolCallId) {
        throw new ProviderError(
          'Tool message missing toolCallId',
          'openai',
        );
      }
      return {
        role: 'tool',
        tool_call_id: msg.toolCallId,
        content: msg.content,
      };
  }
}

function buildTools(tools: ToolDefinition[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

function parseArguments(raw: string): unknown {
  if (!raw || raw.trim() === '') return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    // Return raw string if not valid JSON — caller can decide what to do
    return raw;
  }
}

// ─── Retry logic ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  providerName: string,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (err instanceof OpenAI.APIError) {
        if (err.status === 401) {
          throw new ProviderAuthError(providerName);
        }
        if (err.status === 408 || err.code === 'ETIMEDOUT') {
          throw new ProviderTimeoutError(providerName);
        }
        if (err.status === 429) {
          const retryAfterHeader =
            err.headers?.['retry-after'] ??
            err.headers?.['x-ratelimit-reset-requests'];
          const retryAfterMs = retryAfterHeader
            ? Number(retryAfterHeader) * 1000
            : undefined;

          if (attempt > maxRetries) {
            throw new ProviderRateLimitError(providerName, retryAfterMs);
          }

          const waitMs = retryAfterMs ?? Math.min(1000 * 2 ** (attempt - 1), 30_000);
          await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }
      if (attempt > maxRetries) throw err;
      const backoff = Math.min(500 * 2 ** (attempt - 1), 10_000);
      await new Promise<void>((resolve) => setTimeout(resolve, backoff));
    }
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly defaultModel: string;

  private readonly client: OpenAI;
  private readonly maxRetries: number;

  constructor(config: OpenAIProviderConfig) {
    this.defaultModel = config.model ?? 'gpt-4.1-mini';
    this.maxRetries = config.maxRetries ?? 3;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      // Disable OpenAI's internal retries — we handle them ourselves
      maxRetries: 0,
    });
  }

  // ─── stream ───────────────────────────────────────────────────────────────

  async *stream(input: AgentInput, signal?: AbortSignal): AsyncIterable<ModelEvent> {
    if (signal?.aborted) {
      yield { type: 'done', stopReason: 'cancelled' };
      return;
    }

    const model = input.model ?? this.defaultModel;
    const messages = buildMessages(input);
    const tools = input.tools && input.tools.length > 0 ? buildTools(input.tools) : undefined;

    let openaiStream: Stream<ChatCompletionChunk>;

    try {
      openaiStream = await withRetry(
        () =>
          this.client.chat.completions.create(
            {
              model,
              messages,
              tools,
              tool_choice: tools ? 'auto' : undefined,
              max_tokens: input.maxTokens,
              temperature: input.temperature,
              stream: true,
              stream_options: { include_usage: true },
            },
            { signal },
          ),
        this.maxRetries,
        this.name,
      );
    } catch (err) {
      if (signal?.aborted) {
        yield { type: 'done', stopReason: 'cancelled' };
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      yield { type: 'error', error: message };
      return;
    }

    // Accumulate tool call arguments across deltas
    // key: index (from OpenAI chunk), value: accumulated state
    const toolCallAccumulator = new Map<
      number,
      { callId: string; toolName: string; argumentsBuffer: string }
    >();

    let stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'cancelled' = 'end_turn';

    try {
      for await (const chunk of openaiStream) {
        if (signal?.aborted) {
          stopReason = 'cancelled';
          break;
        }

        // Usage chunk (arrives at end when stream_options.include_usage is set)
        if (chunk.usage) {
          yield {
            type: 'usage',
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }

        const choice = chunk.choices?.[0];
        if (!choice) continue;

        // Capture stop reason
        if (choice.finish_reason) {
          stopReason = choice.finish_reason === 'stop'
            ? 'end_turn'
            : choice.finish_reason === 'tool_calls'
              ? 'tool_use'
              : choice.finish_reason === 'length'
                ? 'max_tokens'
                : 'end_turn';
        }

        const delta = choice.delta;

        // Text delta
        if (delta.content) {
          yield { type: 'text_delta', delta: delta.content };
        }

        // Tool call deltas
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;

            if (!toolCallAccumulator.has(idx)) {
              // First chunk for this tool call — emit start event
              const callId = tc.id ?? `call_${idx}`;
              const toolName = tc.function?.name ?? '';
              toolCallAccumulator.set(idx, {
                callId,
                toolName,
                argumentsBuffer: tc.function?.arguments ?? '',
              });
              yield { type: 'tool_call_start', callId, toolName };
            } else {
              // Subsequent chunks — accumulate arguments and emit delta
              const acc = toolCallAccumulator.get(idx)!;

              // Update name if we get it in a later chunk (rare but possible)
              if (tc.function?.name) {
                acc.toolName = tc.function.name;
              }

              const argDelta = tc.function?.arguments ?? '';
              if (argDelta) {
                acc.argumentsBuffer += argDelta;
                yield {
                  type: 'tool_call_delta',
                  callId: acc.callId,
                  argumentsDelta: argDelta,
                };
              }
            }
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        stopReason = 'cancelled';
      } else {
        const message = err instanceof Error ? err.message : String(err);
        yield { type: 'error', error: message };
        return;
      }
    }

    // Emit tool_call_end for every accumulated tool call
    for (const acc of toolCallAccumulator.values()) {
      yield {
        type: 'tool_call_end',
        callId: acc.callId,
        toolName: acc.toolName,
        arguments: parseArguments(acc.argumentsBuffer),
      };
    }

    yield { type: 'done', stopReason };
  }

  // ─── generate ────────────────────────────────────────────────────────────

  async generate(input: AgentInput, signal?: AbortSignal): Promise<ModelResponse> {
    if (signal?.aborted) {
      throw new ProviderError('Request was aborted before it started', this.name);
    }

    const model = input.model ?? this.defaultModel;
    const messages = buildMessages(input);
    const tools = input.tools && input.tools.length > 0 ? buildTools(input.tools) : undefined;

    const response = await withRetry(
      () =>
        this.client.chat.completions.create(
          {
            model,
            messages,
            tools,
            tool_choice: tools ? 'auto' : undefined,
            max_tokens: input.maxTokens,
            temperature: input.temperature,
            stream: false,
          },
          { signal },
        ),
      this.maxRetries,
      this.name,
    );

    const choice = response.choices[0];
    if (!choice) {
      throw new ProviderError('No choices returned from OpenAI', this.name);
    }

    const content = choice.message.content ?? '';

    const toolCalls: ToolCallRequest[] = (choice.message.tool_calls ?? []).map((tc) => ({
      callId: tc.id,
      toolName: tc.function.name,
      arguments: parseArguments(tc.function.arguments),
    }));

    const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      stopReason: mapFinishReason(choice.finish_reason),
      model: response.model,
    };
  }
}
