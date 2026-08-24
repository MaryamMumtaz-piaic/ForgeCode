import React from 'react';
import { Box, Text } from 'ink';

export interface OutputLine {
  id: string;
  type: 'user' | 'agent' | 'tool' | 'shell' | 'error' | 'success' | 'info';
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolStatus?: 'running' | 'done' | 'error';
  toolDuration?: number;
  timestamp?: number;
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function getToolInputSummary(toolName: string, input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const inp = input as Record<string, unknown>;

  if (toolName.startsWith('filesystem.')) {
    return String(inp['path'] ?? inp['src'] ?? '');
  }
  if (toolName === 'shell.execute') {
    return String(inp['command'] ?? '');
  }
  if (toolName.startsWith('git.')) {
    return String(inp['message'] ?? inp['branch'] ?? inp['ref'] ?? '');
  }
  return '';
}

function getToolOutputSummary(toolName: string, output: unknown): string {
  if (!output || typeof output !== 'object') return '';
  const out = output as Record<string, unknown>;

  if (toolName === 'filesystem.read') {
    const size = typeof out['size'] === 'number' ? ` · ${formatBytes(out['size'])}` : '';
    return `read${size}`;
  }
  if (toolName === 'filesystem.list') {
    const entries = Array.isArray(out['entries']) ? out['entries'].length : 0;
    return `${entries} entries`;
  }
  if (toolName === 'filesystem.write' || toolName === 'filesystem.edit') {
    return 'written';
  }
  if (toolName === 'shell.execute') {
    const code = out['exitCode'];
    return code === 0 ? 'exit 0' : `exit ${code}`;
  }
  if (toolName.startsWith('git.')) {
    return 'done';
  }
  return '';
}

function ToolLine({ line }: { line: OutputLine }) {
  const statusIcon = line.toolStatus === 'running'
    ? '◌'
    : line.toolStatus === 'done'
    ? '✓'
    : '✗';
  const statusColor = line.toolStatus === 'running'
    ? 'cyan'
    : line.toolStatus === 'done'
    ? 'green'
    : 'red';

  const inputSummary = line.toolInput ? getToolInputSummary(line.toolName ?? '', line.toolInput) : '';

  let outputSummary = '';
  if (line.toolStatus !== 'running') {
    try {
      const parsed: unknown = line.content ? JSON.parse(line.content) : undefined;
      outputSummary = parsed ? getToolOutputSummary(line.toolName ?? '', parsed) : '';
    } catch {
      outputSummary = line.content ? line.content.slice(0, 60) : '';
    }
  }

  const duration = line.toolDuration ? formatDuration(line.toolDuration) : '';

  return (
    <Box flexDirection="column" paddingLeft={2} marginY={0}>
      <Box>
        <Text dimColor>┌─ </Text>
        <Text color="cyan">{line.toolName ?? 'tool'}</Text>
        {inputSummary && <Text dimColor>  {inputSummary}</Text>}
      </Box>
      {line.toolStatus === 'running' && (
        <Box>
          <Text dimColor>│  </Text>
          <Text color="cyan" dimColor>running...</Text>
        </Box>
      )}
      <Box>
        <Text color={statusColor}>{statusIcon} </Text>
        {outputSummary ? (
          <Text dimColor>{outputSummary}</Text>
        ) : null}
        {duration && <Text dimColor>  {duration}</Text>}
      </Box>
    </Box>
  );
}

function ShellLine({ line }: { line: OutputLine }) {
  const lines = line.content.split('\n').filter(Boolean);
  const exitMatch = line.content.match(/Exit: (\d+)/);
  const exitCode = exitMatch ? parseInt(exitMatch[1] ?? '0') : undefined;
  const success = exitCode === 0 || exitCode === undefined;
  const outputLines = lines.filter(l => !l.startsWith('Exit:') && !l.startsWith('Duration:'));
  const durationMatch = line.content.match(/Duration: ([^\n]+)/);

  return (
    <Box flexDirection="column" paddingLeft={2} marginY={0}>
      <Box>
        <Text color="yellow">$ </Text>
        <Text bold>{line.toolName ?? 'shell'}</Text>
      </Box>
      {outputLines.slice(0, 20).map((l, i) => (
        <Box key={i} paddingLeft={2}>
          <Text dimColor>{l}</Text>
        </Box>
      ))}
      {outputLines.length > 20 && (
        <Box paddingLeft={2}>
          <Text dimColor>...{outputLines.length - 20} more lines</Text>
        </Box>
      )}
      <Box>
        <Text color={success ? 'green' : 'red'}>{success ? '✓' : '✗'} </Text>
        {exitCode !== undefined && <Text dimColor>exit {exitCode}</Text>}
        {durationMatch && <Text dimColor>  {durationMatch[1]}</Text>}
      </Box>
    </Box>
  );
}

function LineView({ line }: { line: OutputLine }) {
  switch (line.type) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text bold color="cyan">{'> '}</Text>
          <Text>{line.content}</Text>
        </Box>
      );

    case 'agent':
      return (
        <Box paddingLeft={2} marginBottom={0}>
          <Text>{line.content}</Text>
        </Box>
      );

    case 'tool':
      return <ToolLine line={line} />;

    case 'shell':
      return <ShellLine line={line} />;

    case 'error':
      return (
        <Box flexDirection="column" paddingLeft={2} marginY={0}>
          <Box>
            <Text color="red" bold>✗ </Text>
            <Text color="red">{line.content.split('\n')[0]}</Text>
          </Box>
          {line.content.includes('\n') && (
            <Box paddingLeft={2}>
              <Text dimColor>{line.content.split('\n').slice(1).join('\n')}</Text>
            </Box>
          )}
        </Box>
      );

    case 'success':
      return (
        <Box paddingLeft={2} marginBottom={1}>
          <Text color="green">✓ </Text>
          <Text>{line.content}</Text>
        </Box>
      );

    case 'info':
      return (
        <Box paddingLeft={2}>
          <Text dimColor color="cyan">ℹ </Text>
          <Text dimColor>{line.content}</Text>
        </Box>
      );
  }
}

interface Props {
  lines: OutputLine[];
}

export function Output({ lines }: Props) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
      {lines.map(line => (
        <LineView key={line.id} line={line} />
      ))}
    </Box>
  );
}
