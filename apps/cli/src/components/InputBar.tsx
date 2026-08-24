import React, { useCallback, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { CommandPalette } from './CommandPalette.js';

interface Props {
  onSubmit: (input: string, isShell?: boolean) => void;
  onCommand: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSubmit, onCommand, disabled = false, placeholder = 'Ask ForgeCode anything...' }: Props) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPalette, setShowPalette] = useState(false);

  const isShellMode = value.startsWith('!');
  const isCommandMode = value.startsWith('/');

  const doSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    if (isCommandMode) {
      onCommand(text.trim());
      setHistory(prev => [text, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);
      setValue('');
      setShowPalette(false);
      return;
    }
    setHistory(prev => [text, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    setShowPalette(false);
    onSubmit(isShellMode ? text.slice(1).trim() : text.trim(), isShellMode);
    setValue('');
  }, [isCommandMode, isShellMode, onSubmit, onCommand]);

  useInput((input, key) => {
    if (disabled) return;

    if (key.return) {
      if (!showPalette) doSubmit(value);
      return;
    }
    if (key.escape) {
      if (showPalette) { setShowPalette(false); setValue(''); }
      return;
    }
    if (key.upArrow && !showPalette) {
      const next = historyIndex + 1;
      if (next < history.length) { setHistoryIndex(next); setValue(history[next] ?? ''); }
      return;
    }
    if (key.downArrow && !showPalette) {
      if (historyIndex > 0) { const n = historyIndex - 1; setHistoryIndex(n); setValue(history[n] ?? ''); }
      else { setHistoryIndex(-1); setValue(''); }
      return;
    }
    if (key.backspace || key.delete) {
      const nv = value.slice(0, -1);
      setValue(nv);
      setShowPalette(nv.startsWith('/'));
      return;
    }
    if (!key.ctrl && !key.meta && !key.tab && input) {
      const nv = value + input;
      setValue(nv);
      setShowPalette(nv.startsWith('/'));
    }
  });

  const borderColor = disabled ? 'gray' : isShellMode ? 'yellow' : isCommandMode ? 'magenta' : 'cyan';
  const prefix = disabled ? '  ' : isShellMode ? '$ ' : isCommandMode ? '/ ' : '> ';

  return (
    <Box flexDirection="column">
      {showPalette && (
        <CommandPalette
          query={value}
          onSelect={cmd => { setValue(cmd + ' '); setShowPalette(false); }}
          onClose={() => { setShowPalette(false); setValue(''); }}
        />
      )}
      <Box borderStyle="single" borderColor={borderColor} paddingX={1} marginX={0}>
        <Text bold color={borderColor}>{prefix}</Text>
        <Text>{(isShellMode ? value.slice(1) : value) || (disabled ? '' : placeholder)}</Text>
        {!disabled && <Text color={borderColor}>█</Text>}
      </Box>
      {!disabled && (
        <Box paddingX={2} gap={3}>
          <Text dimColor>Enter send</Text>
          <Text dimColor>↑↓ history</Text>
          <Text dimColor><Text color="magenta">/</Text> commands</Text>
          <Text dimColor><Text color="cyan">@</Text> files</Text>
          <Text dimColor><Text color="yellow">!</Text> shell</Text>
          <Text dimColor>Esc cancel  Ctrl+C exit</Text>
        </Box>
      )}
    </Box>
  );
}
