// ─── Agent Input ───────────────────────────────────────────────────────────

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema object
}

export interface AgentInput {
  messages: AgentMessage[];
  tools?: ToolDefinition[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// ─── Streaming Model Events ─────────────────────────────────────────────────

export type ModelEventType =
  | 'text_delta'
  | 'tool_call_start'
  | 'tool_call_delta'
  | 'tool_call_end'
  | 'usage'
  | 'done'
  | 'error';

export interface TextDeltaEvent {
  type: 'text_delta';
  delta: string;
}

export interface ToolCallStartEvent {
  type: 'tool_call_start';
  callId: string;
  toolName: string;
}

export interface ToolCallDeltaEvent {
  type: 'tool_call_delta';
  callId: string;
  argumentsDelta: string;
}

export interface ToolCallEndEvent {
  type: 'tool_call_end';
  callId: string;
  toolName: string;
  arguments: unknown;
}

export interface UsageEvent {
  type: 'usage';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface DoneEvent {
  type: 'done';
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'cancelled';
}

export interface ErrorEvent {
  type: 'error';
  error: string;
}

export type ModelEvent =
  | TextDeltaEvent
  | ToolCallStartEvent
  | ToolCallDeltaEvent
  | ToolCallEndEvent
  | UsageEvent
  | DoneEvent
  | ErrorEvent;

// ─── Non-Streaming Response ─────────────────────────────────────────────────

export interface ToolCallRequest {
  callId: string;
  toolName: string;
  arguments: unknown;
}

export interface ModelResponse {
  content: string;
  toolCalls: ToolCallRequest[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  model: string;
}

// ─── Provider Interface ─────────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  stream(input: AgentInput, signal?: AbortSignal): AsyncIterable<ModelEvent>;
  generate(input: AgentInput, signal?: AbortSignal): Promise<ModelResponse>;
}
