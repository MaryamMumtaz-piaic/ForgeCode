import React from 'react';
import { Box, Text } from 'ink';

interface OutputLine {
  type: 'user' | 'agent' | 'tool' | 'error' | 'success';
  content: string;
  toolName?: string;
}

interface Props {
  lines: OutputLine[];
}

function LineView({ line }: { line: OutputLine }) {
  switch (line.type) {
    case 'user':
      return (
        <Box>
          <Text bold color="cyan">{'> '}</Text>
          <Text>{line.content}</Text>
        </Box>
      );
    case 'agent':
      return (
        <Box paddingLeft={2}>
          <Text>{line.content}</Text>
        </Box>
      );
    case 'tool':
      return (
        <Box paddingLeft={2}>
          <Text dimColor>{'├─ '}</Text>
          <Text color="cyan">{line.toolName}</Text>
          {line.content ? <Text dimColor>{' · ' + line.content}</Text> : null}
        </Box>
      );
    case 'error':
      return (
        <Box paddingLeft={2}>
          <Text color="red">✗ {line.content}</Text>
        </Box>
      );
    case 'success':
      return (
        <Box paddingLeft={2}>
          <Text color="green">✓ {line.content}</Text>
        </Box>
      );
  }
}

export function Output({ lines }: Props) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {lines.map((line, i) => (
        <LineView key={i} line={line} />
      ))}
    </Box>
  );
}

export type { OutputLine };
