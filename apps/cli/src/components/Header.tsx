import React from 'react';
import { Box, Text } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';
import type { WorkspaceContext } from '../context.js';

interface Props {
  state: AgentState;
  context: WorkspaceContext;
  compact?: boolean;
}

const STATE_LABEL: Record<AgentState, string> = {
  [AgentState.IDLE]: 'ready',
  [AgentState.THINKING]: 'thinking',
  [AgentState.PLANNING]: 'planning',
  [AgentState.SEARCHING]: 'searching',
  [AgentState.READING]: 'reading',
  [AgentState.EDITING]: 'editing',
  [AgentState.EXECUTING]: 'executing',
  [AgentState.WAITING_FOR_APPROVAL]: 'waiting',
  [AgentState.VERIFYING]: 'verifying',
  [AgentState.COMPLETED]: 'done',
  [AgentState.FAILED]: 'error',
  [AgentState.CANCELLED]: 'cancelled',
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

export function Header({ state, context, compact = false }: Props) {
  const stateColor = STATE_COLOR[state] ?? 'gray';
  const stateLabel = STATE_LABEL[state] ?? state;

  if (compact) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color="cyan">FORGE</Text>
          <Text dimColor>{context.workspaceName}</Text>
          {context.gitBranch && <Text color="magenta">⎇ {context.gitBranch}</Text>}
        </Box>
        <Text color={stateColor}>● {stateLabel}</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
      <Box gap={2}>
        <Text bold color="cyan">FORGECODE</Text>
        <Text dimColor>·</Text>
        <Text color="white">{context.workspaceName}</Text>
        {context.gitBranch && (
          <>
            <Text dimColor>·</Text>
            <Text color="magenta">⎇ {context.gitBranch}</Text>
            {(context.gitChangedFiles ?? 0) > 0 && (
              <Text color="yellow"> +{context.gitChangedFiles}</Text>
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
      <Text color={stateColor}>● {stateLabel}</Text>
    </Box>
  );
}
