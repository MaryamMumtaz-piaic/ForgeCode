import React from 'react';
import { Box, Text } from 'ink';

export interface ToolActivity {
  id: string;
  name: string;
  status: 'running' | 'done' | 'error';
  durationMs?: number;
  inputSummary?: string;
}

interface Props {
  activities: ToolActivity[];
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function ActivityPanel({ activities }: Props) {
  const running = activities.filter(a => a.status === 'running');
  if (running.length === 0) return null;

  const frame = SPINNER_FRAMES[Math.floor(Date.now() / 80) % SPINNER_FRAMES.length] ?? '⠋';

  return (
    <Box flexDirection="column" paddingX={2} paddingBottom={0}>
      <Box gap={1}>
        <Text color="cyan">{frame}</Text>
        <Text color="cyan" bold>Agent working</Text>
      </Box>
      {running.slice(0, 3).map(a => (
        <Box key={a.id} paddingLeft={2}>
          <Text dimColor>→ </Text>
          <Text color="cyan">{a.name}</Text>
          {a.inputSummary && <Text dimColor>  {a.inputSummary}</Text>}
        </Box>
      ))}
    </Box>
  );
}
