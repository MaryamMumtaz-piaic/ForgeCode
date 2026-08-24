import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSubmit, disabled = false, placeholder = '' }: Props) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useInput((input, key) => {
    if (disabled) return;

    if (key.return) {
      if (value.trim()) {
        setHistory(prev => [value, ...prev]);
        setHistoryIndex(-1);
        onSubmit(value.trim());
        setValue('');
      }
      return;
    }

    if (key.upArrow) {
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex] ?? '');
      }
      return;
    }

    if (key.downArrow) {
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex] ?? '');
      } else {
        setHistoryIndex(-1);
        setValue('');
      }
      return;
    }

    if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && input) {
      setValue(prev => prev + input);
    }
  });

  return (
    <Box paddingX={1} borderStyle="single" borderColor={disabled ? 'gray' : 'cyan'}>
      <Text bold color={disabled ? 'gray' : 'cyan'}>{disabled ? '  ' : '> '}</Text>
      <Text>{value || (disabled ? '' : placeholder)}</Text>
      {!disabled && <Text color="cyan">█</Text>}
    </Box>
  );
}
