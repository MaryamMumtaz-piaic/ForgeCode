import React from 'react';
import { Box, Text } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';
import type { WorkspaceContext } from '../context.js';

interface Props {
  model: string;
  state: AgentState;
  context: WorkspaceContext;
}

const STATE_LABEL: Record<AgentState, string> = {
  [AgentState.IDLE]: 'READY',
  [AgentState.THINKING]: 'THINKING',
  [AgentState.PLANNING]: 'PLANNING',
  [AgentState.SEARCHING]: 'SEARCHING',
  [AgentState.READING]: 'READING',
  [AgentState.EDITING]: 'EDITING',
  [AgentState.EXECUTING]: 'EXECUTING',
  [AgentState.WAITING_FOR_APPROVAL]: 'WAITING',
  [AgentState.VERIFYING]: 'VERIFYING',
  [AgentState.COMPLETED]: 'DONE',
  [AgentState.FAILED]: 'ERROR',
  [AgentState.CANCELLED]: 'CANCELLED',
};

const STATE_COLOR: Record<AgentState, string> = {
  [AgentState.IDLE]: 'green',
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

export function Header({ model, state, context }: Props) {
  const stateColor = STATE_COLOR[state] ?? 'gray';
  const stateLabel = STATE_LABEL[state] ?? state;
  const wsName = context.workspaceName;

  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1} flexDirection="column">
      <Box justifyContent="space-between">
        <Box gap={2}>
          <Text bold color="cyan">FORGECODE</Text>
          <Text dimColor>·</Text>
          <Text color="white">{wsName}</Text>
          {context.gitBranch && (
            <>
              <Text dimColor>·</Text>
              <Text color="magenta">⎇ {context.gitBranch}</Text>
              {(context.gitChangedFiles ?? 0) > 0 && (
                <Text color="yellow">+{context.gitChangedFiles}</Text>
              )}
            </>
          )}
          {context.projectType && (
            <>
              <Text dimColor>·</Text>
              <Text dimColor>{context.projectType}</Text>
            </>
          )}
        </Box>
        <Box gap={2}>
          <Text dimColor>{model}</Text>
          <Text color={stateColor}>● {stateLabel}</Text>
        </Box>
      </Box>
    </Box>
  );
}
