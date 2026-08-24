import React from 'react';
import { Box, Text } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';

interface Props {
  model: string;
  tokens: number;
  toolCount: number;
  elapsedMs: number;
  agentState: AgentState;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatTokens(n: number): string {
  if (n === 0) return '';
  if (n < 1000) return `${n} tok`;
  return `${(n / 1000).toFixed(1)}k tok`;
}

const ACTIVE_STATES = new Set<AgentState>([
  AgentState.THINKING, AgentState.PLANNING, AgentState.SEARCHING,
  AgentState.READING, AgentState.EDITING, AgentState.EXECUTING, AgentState.VERIFYING,
]);

export function StatusBar({ model, tokens, toolCount, elapsedMs, agentState }: Props) {
  const isActive = ACTIVE_STATES.has(agentState);
  const tokStr = formatTokens(tokens);
  const durStr = isActive ? formatDuration(elapsedMs) : '';

  return (
    <Box paddingX={1} borderStyle="single" borderColor="gray" justifyContent="space-between">
      <Box gap={3}>
        {tokStr ? <Text dimColor>{tokStr}</Text> : null}
        {toolCount > 0 && <Text dimColor>{toolCount} tools</Text>}
        {durStr ? <Text dimColor>{durStr}</Text> : null}
        {!isActive && <Text dimColor>Ctrl+C exit  Ctrl+L clear  / commands</Text>}
      </Box>
      <Text dimColor>{model}</Text>
    </Box>
  );
}
