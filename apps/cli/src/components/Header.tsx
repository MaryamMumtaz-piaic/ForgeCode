import React from 'react';
import { Box, Text } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';

interface Props {
  model: string;
  state: AgentState;
  cwd: string;
}

const STATE_COLORS: Record<AgentState, string> = {
  [AgentState.IDLE]: 'gray',
  [AgentState.THINKING]: 'cyan',
  [AgentState.PLANNING]: 'cyan',
  [AgentState.SEARCHING]: 'cyan',
  [AgentState.READING]: 'cyan',
  [AgentState.EDITING]: 'yellow',
  [AgentState.EXECUTING]: 'yellow',
  [AgentState.WAITING_FOR_APPROVAL]: 'yellow',
  [AgentState.VERIFYING]: 'cyan',
  [AgentState.COMPLETED]: 'green',
  [AgentState.FAILED]: 'red',
  [AgentState.CANCELLED]: 'gray',
};

export function Header({ model, state, cwd }: Props) {
  const color = STATE_COLORS[state] ?? 'gray';
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">FORGECODE</Text>
        <Box gap={2}>
          <Text dimColor>{model}</Text>
          <Text color={color}>● {state}</Text>
        </Box>
      </Box>
      <Text dimColor>{cwd}</Text>
    </Box>
  );
}
