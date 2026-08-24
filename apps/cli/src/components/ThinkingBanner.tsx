import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const STATE_LABEL: Partial<Record<AgentState, string>> = {
  [AgentState.THINKING]:  'Thinking',
  [AgentState.PLANNING]:  'Planning',
  [AgentState.SEARCHING]: 'Searching',
  [AgentState.READING]:   'Reading',
  [AgentState.VERIFYING]: 'Verifying',
};

const THINKING_STATES = new Set<AgentState>([
  AgentState.THINKING,
  AgentState.PLANNING,
  AgentState.SEARCHING,
  AgentState.READING,
  AgentState.VERIFYING,
]);

interface Props {
  state: AgentState;
  hasActiveTools: boolean;
}

export function ThinkingBanner({ state, hasActiveTools }: Props) {
  const [frame, setFrame] = useState(0);

  const isThinking = THINKING_STATES.has(state) && !hasActiveTools;

  useEffect(() => {
    if (!isThinking) return;
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 100);
    return () => clearInterval(t);
  }, [isThinking]);

  if (!isThinking) return null;

  const label = STATE_LABEL[state] ?? state.toLowerCase();
  const spinChar = SPINNER[frame % SPINNER.length] ?? '⠋';

  return (
    <Box paddingX={2} paddingY={0}>
      <Text color="cyan">{spinChar} </Text>
      <Text color="cyan">{label}</Text>
      <Text dimColor>...</Text>
    </Box>
  );
}
