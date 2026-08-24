import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  tokens: number;
  stepCount: number;
  maxSteps: number;
  elapsedMs: number;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export function StatusBar({ tokens, stepCount, maxSteps, elapsedMs }: Props) {
  return (
    <Box paddingX={1} gap={3} borderStyle="single" borderColor="gray">
      <Text dimColor>{tokens.toLocaleString()} tokens</Text>
      <Text dimColor>Step {stepCount}/{maxSteps}</Text>
      <Text dimColor>{formatDuration(elapsedMs)}</Text>
    </Box>
  );
}
