import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

const LOGO = [
  '  ███████╗ ██████╗ ██████╗  ██████╗ ███████╗',
  '  ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝',
  '  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  ',
  '  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  ',
  '  ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗',
  '  ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝',
];

const STEPS = [
  'Initializing ForgeCode',
  'Loading agent runtime',
  'Loading model provider',
  'Checking workspace',
  'Filesystem tools ready',
  'Terminal tools ready',
  'Session ready',
];

interface Props {
  model: string;
  cwd: string;
  onDone: () => void;
}

export function StartupScreen({ model, cwd, onDone }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const workspaceName = cwd.split(/[\\/]/).filter(Boolean).pop() ?? cwd;

  useEffect(() => {
    let current = 0;
    const tick = () => {
      if (current < STEPS.length) {
        current++;
        setVisibleSteps(current);
        setTimeout(tick, 70);
      } else {
        setTimeout(() => {
          setAllDone(true);
          setTimeout(onDone, 150);
        }, 200);
      }
    };
    setTimeout(tick, 30);
  }, [onDone]);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={3} paddingY={1}>
        {LOGO.map((line, i) => (
          <Text key={i} color="cyan" bold>{line}</Text>
        ))}
        <Text> </Text>
        <Text dimColor>  AI Coding Agent  ·  v0.1.0</Text>
      </Box>

      <Box gap={4} paddingX={1} marginTop={1}>
        <Text dimColor>Model: <Text color="cyan">{model}</Text></Text>
        <Text dimColor>Workspace: <Text color="white">{workspaceName}</Text></Text>
        <Text color="green">● Ready</Text>
      </Box>

      <Box flexDirection="column" marginTop={1} paddingX={1}>
        {STEPS.slice(0, visibleSteps).map((step, i) => {
          const isDone = allDone || i < visibleSteps - 1;
          return (
            <Box key={i}>
              <Text color={isDone ? 'green' : 'cyan'}>
                {isDone ? '✓' : '◌'}{' '}
              </Text>
              <Text color={isDone ? undefined : 'white'}>{step}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
