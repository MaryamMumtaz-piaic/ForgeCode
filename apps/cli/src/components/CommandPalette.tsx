import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SlashCommand {
  name: string;
  description: string;
  args?: string;
  category?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Agent
  { name: '/agent',        description: 'List running agents',               category: 'Agent' },
  { name: '/agent new',    description: 'Create a new custom agent',         args: '<name>',       category: 'Agent' },
  { name: '/agent list',   description: 'List all defined agents',           category: 'Agent' },
  { name: '/agent run',    description: 'Run a named agent',                 args: '<name>',       category: 'Agent' },
  { name: '/loop',         description: 'Run agent in a continuous loop',    args: '[prompt]',     category: 'Agent' },
  { name: '/resume',       description: 'Resume last session or named one',  args: '[session]',    category: 'Agent' },
  // Tasks
  { name: '/task',         description: 'List all tasks',                    category: 'Tasks' },
  { name: '/task new',     description: 'Create a new task',                 args: '<description>', category: 'Tasks' },
  { name: '/task list',    description: 'List tasks by status',              category: 'Tasks' },
  { name: '/task cancel',  description: 'Cancel a running task',             args: '<id>',         category: 'Tasks' },
  // Workspace
  { name: '/workspace',    description: 'Show current workspace',            category: 'Workspace' },
  { name: '/workspace open', description: 'Open a new workspace folder',     args: '<path>',       category: 'Workspace' },
  { name: '/workspace list', description: 'List recent workspaces',          category: 'Workspace' },
  // Session
  { name: '/session',      description: 'List sessions',                     category: 'Session' },
  { name: '/session new',  description: 'Start a new session',               category: 'Session' },
  { name: '/session list', description: 'Show all sessions',                 category: 'Session' },
  { name: '/session switch', description: 'Switch to a session',             args: '<name>',       category: 'Session' },
  // Filesystem
  { name: '/files',        description: 'Explore filesystem',                args: '[path]',       category: 'Files' },
  { name: '/search',       description: 'Search project files',              args: '<query>',      category: 'Files' },
  { name: '/diff',         description: 'Show current Git diff',             category: 'Files' },
  { name: '/undo',         description: 'Undo last agent change',            category: 'Files' },
  // Git
  { name: '/git',          description: 'Git status overview',               category: 'Git' },
  { name: '/git status',   description: 'Show working tree status',          category: 'Git' },
  { name: '/git log',      description: 'Show recent commits',               category: 'Git' },
  { name: '/git diff',     description: 'Show unstaged changes',             category: 'Git' },
  // Tools
  { name: '/run',          description: 'Execute a shell command',           args: '<command>',    category: 'Shell' },
  { name: '/permissions',  description: 'Manage tool permissions',           category: 'Config' },
  { name: '/model',        description: 'Change AI model',                   args: '<model>',      category: 'Config' },
  { name: '/memory',       description: 'View/clear agent memory',           category: 'Config' },
  { name: '/config',       description: 'Open ForgeCode configuration',      category: 'Config' },
  // General
  { name: '/status',       description: 'Show system status',                category: 'General' },
  { name: '/help',         description: 'Show all commands',                 category: 'General' },
  { name: '/clear',        description: 'Clear conversation',                category: 'General' },
  { name: '/reset',        description: 'Reset agent session',               category: 'General' },
  { name: '/exit',         description: 'Exit ForgeCode',                    category: 'General' },
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
  const clamped = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  useInput((_input, key) => {
    if (key.escape) { onClose(); return; }
    if (key.upArrow) { setSelectedIndex(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setSelectedIndex(i => Math.min(filtered.length - 1, i + 1)); return; }
    if (key.return || key.tab) {
      const cmd = filtered[clamped];
      if (cmd) onSelect(cmd.name);
    }
  });

  if (filtered.length === 0) return null;

  const visible = filtered.slice(0, 10);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="magenta" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="magenta">Commands</Text>
        <Text dimColor>↑↓ nav  Tab/Enter select  Esc close</Text>
      </Box>
      <Text> </Text>
      {visible.map((cmd, i) => {
        const isSel = i === clamped;
        return (
          <Box key={cmd.name}>
            <Text color={isSel ? 'magenta' : 'gray'}>{isSel ? '▸ ' : '  '}</Text>
            <Text bold={isSel} color={isSel ? 'white' : 'white'}>{cmd.name.padEnd(18)}</Text>
            {cmd.args
              ? <Text color={isSel ? 'cyan' : 'gray'}>{cmd.args.padEnd(14)}</Text>
              : <Text>{''.padEnd(14)}</Text>}
            <Text dimColor>{cmd.description}</Text>
          </Box>
        );
      })}
      {filtered.length > 10 && (
        <Text dimColor>  +{filtered.length - 10} more — keep typing to filter</Text>
      )}
    </Box>
  );
}
