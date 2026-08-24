import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SlashCommand {
  name: string;
  description: string;
  args?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: '/help', description: 'Show ForgeCode commands' },
  { name: '/clear', description: 'Clear conversation' },
  { name: '/reset', description: 'Reset agent session' },
  { name: '/model', description: 'Change AI model', args: '<model>' },
  { name: '/status', description: 'Show system status' },
  { name: '/config', description: 'Open configuration' },
  { name: '/memory', description: 'Manage agent memory' },
  { name: '/files', description: 'Inspect filesystem', args: '[path]' },
  { name: '/search', description: 'Search project files', args: '<query>' },
  { name: '/run', description: 'Execute shell command', args: '<command>' },
  { name: '/git', description: 'Git operations', args: '[status|diff|log]' },
  { name: '/diff', description: 'Show current changes' },
  { name: '/workspace', description: 'Manage workspace', args: '[open|list|switch]' },
  { name: '/session', description: 'Manage sessions', args: '[new|list|switch]' },
  { name: '/permissions', description: 'Manage tool permissions' },
  { name: '/undo', description: 'Undo latest agent change' },
  { name: '/exit', description: 'Exit ForgeCode' },
];

function fuzzyMatch(query: string, command: string): boolean {
  const q = query.toLowerCase().replace(/^\//, '');
  const c = command.toLowerCase().replace(/^\//, '');
  if (!q) return true;
  let qi = 0;
  for (let ci = 0; ci < c.length && qi < q.length; ci++) {
    if (c[ci] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface Props {
  query: string;
  onSelect: (command: string) => void;
  onClose: () => void;
}

export function CommandPalette({ query, onSelect, onClose }: Props) {
  const filtered = SLASH_COMMANDS.filter(c => fuzzyMatch(query, c.name));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  useInput((_input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(filtered.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const cmd = filtered[clampedIndex];
      if (cmd) onSelect(cmd.name);
    }
    if (key.tab) {
      const cmd = filtered[clampedIndex];
      if (cmd) onSelect(cmd.name);
    }
  });

  if (filtered.length === 0) return null;

  const visible = filtered.slice(0, 12);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      paddingY={0}
      marginBottom={0}
    >
      <Box>
        <Text bold color="magenta">Commands </Text>
        <Text dimColor>↑↓ navigate  Enter select  Esc close</Text>
      </Box>
      <Text> </Text>
      {visible.map((cmd, i) => {
        const isSel = i === clampedIndex;
        return (
          <Box key={cmd.name}>
            <Text color={isSel ? 'magenta' : 'gray'}>{isSel ? '▸ ' : '  '}</Text>
            <Text bold={isSel} color={isSel ? 'white' : 'white'}>
              {cmd.name.padEnd(16)}
            </Text>
            {cmd.args && <Text color={isSel ? 'cyan' : 'gray'}>{cmd.args.padEnd(18)}</Text>}
            <Text dimColor>{cmd.description}</Text>
          </Box>
        );
      })}
      {filtered.length > 12 && (
        <Text dimColor>  ...{filtered.length - 12} more</Text>
      )}
    </Box>
  );
}
