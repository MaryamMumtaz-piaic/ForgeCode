import React from 'react';
import { Box, Text } from 'ink';

export interface ToolActivity {
  name: string;
  status: 'running' | 'done' | 'error';
  durationMs?: number;
}

interface Props {
  activities: ToolActivity[];
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ActivityPanel({ activities }: Props) {
  if (activities.length === 0) return null;
  return (
    <Box flexDirection="column" paddingX={1} paddingBottom={1}>
      <Text bold color="yellow">⚡ Agent Activity</Text>
      {activities.map((a, i) => {
        const isLast = i === activities.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const statusIcon =
          a.status === 'running' ? '◌' : a.status === 'done' ? '✓' : '✗';
        const statusColor =
          a.status === 'running' ? 'cyan' : a.status === 'done' ? 'green' : 'red';
        return (
          <Box key={i}>
            <Text dimColor>{prefix} </Text>
            <Text color={statusColor}>{statusIcon} </Text>
            <Text>{a.name}</Text>
            {a.durationMs !== undefined && (
              <Text dimColor>{'  ' + formatDuration(a.durationMs)}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
