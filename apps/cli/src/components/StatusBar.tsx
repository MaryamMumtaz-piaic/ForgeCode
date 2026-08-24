import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  tokens: number;
  stepCount: number;
  maxSteps: number;
  elapsedMs: number;
  toolCount: number;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}k`;
}

export function StatusBar({ tokens, stepCount, maxSteps, elapsedMs, toolCount }: Props) {
  return (
    <Box paddingX={1} gap={3} borderStyle="single" borderColor="gray">
      <Text dimColor>tokens <Text color="white">{formatTokens(tokens)}</Text></Text>
      <Text dimColor>steps <Text color="white">{stepCount}</Text><Text>/{maxSteps}</Text></Text>
      {toolCount > 0 && <Text dimColor>tools <Text color="white">{toolCount}</Text></Text>}
      <Text dimColor>{formatDuration(elapsedMs)}</Text>
      <Text dimColor>Ctrl+C cancel/exit  Ctrl+L clear</Text>
    </Box>
  );
}
