import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';
import { Header } from './Header.js';
import { Output, OutputLine } from './Output.js';
import { ActivityPanel, ToolActivity } from './ActivityPanel.js';
import { StatusBar } from './StatusBar.js';
import { InputBar } from './InputBar.js';
import { ApprovalPrompt, ApprovalAnswer, ApprovalRequest } from './ApprovalPrompt.js';
import { StartupScreen } from './StartupScreen.js';
import { ForgeSession } from '../session.js';
import { detectContext, WorkspaceContext } from '../context.js';

interface Props {
  session: ForgeSession;
  model: string;
  cwd: string;
}

let lineCounter = 0;
function nextId(): string {
  return String(++lineCounter);
}

export function App({ session, model, cwd }: Props) {
  const { exit } = useApp();
  const [started, setStarted] = useState(false);
  const [context, setContext] = useState<WorkspaceContext>({
    cwd,
    workspaceName: cwd.split(/[\\/]/).filter(Boolean).pop() ?? cwd,
    isGitRepo: false,
  });
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [activities, setActivities] = useState<ToolActivity[]>([]);
  const [tokens, setTokens] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [toolCount, setToolCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const approvalResolveRef = useRef<((answer: ApprovalAnswer) => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toolLineMap = useRef<Map<string, string>>(new Map());
  const agentStateRef = useRef(agentState);
  agentStateRef.current = agentState;

  useEffect(() => {
    if (!started) return;
    detectContext(cwd).then(ctx => setContext(ctx)).catch(() => {});
  }, [started, cwd]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const addLine = useCallback((line: Omit<OutputLine, 'id'>) => {
    setLines(prev => [...prev.slice(-300), { ...line, id: nextId() }]);
  }, []);

  const updateToolLine = useCallback((id: string, updates: Partial<OutputLine>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  useInput((_input, key) => {
    if (key.ctrl && _input === 'c') {
      if (abortRef.current) {
        abortRef.current.abort();
        addLine({ type: 'error', content: 'Cancelled.', timestamp: Date.now() });
        setAgentState(AgentState.CANCELLED);
        setActivities([]);
      } else {
        exit();
      }
    }
    if (key.ctrl && _input === 'l') {
      setLines([]);
      setActivities([]);
    }
  });

  const handleApprovalAnswer = useCallback((answer: ApprovalAnswer) => {
    setApproval(null);
    setAgentState(AgentState.EXECUTING);
    approvalResolveRef.current?.(answer);
    approvalResolveRef.current = null;
  }, []);

  const isIdle = useCallback(() => {
    const s = agentStateRef.current;
    return (
      s === AgentState.IDLE ||
      s === AgentState.COMPLETED ||
      s === AgentState.FAILED ||
      s === AgentState.CANCELLED
    );
  }, []);

  const handleSubmit = useCallback(async (input: string, isShell = false, skipUserLine = false) => {
    if (!isIdle()) return;

    if (!skipUserLine) {
      addLine({ type: 'user', content: isShell ? `! ${input}` : input, timestamp: Date.now() });
    }
    setAgentState(AgentState.THINKING);
    setActivities([]);
    setStepCount(0);
    setToolCount(0);
    toolLineMap.current.clear();

    const abort = new AbortController();
    abortRef.current = abort;

    const callbacks = {
      signal: abort.signal,
      onStateChange(state: AgentState) {
        setAgentState(state);
      },
      onTextDelta(delta: string) {
        setLines(prev => {
          const last = prev[prev.length - 1];
          if (last?.type === 'agent') {
            return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
          }
          return [...prev, { id: nextId(), type: 'agent' as const, content: delta, timestamp: Date.now() }];
        });
      },
      onToolStart(id: string, name: string, toolInput?: unknown) {
        const lineId = nextId();
        toolLineMap.current.set(id, lineId);
        setLines(prev => [
          ...prev,
          {
            id: lineId,
            type: 'tool' as const,
            toolName: name,
            toolInput,
            toolStatus: 'running' as const,
            content: '',
            timestamp: Date.now(),
          },
        ]);
        setActivities(prev => [...prev, { id, name, status: 'running' as const }]);
        setStepCount(n => n + 1);
        setToolCount(n => n + 1);
      },
      onToolEnd(id: string, name: string, durationMs: number, success: boolean, output?: unknown) {
        const lineId = toolLineMap.current.get(id);
        if (lineId) {
          updateToolLine(lineId, {
            toolStatus: success ? 'done' : 'error',
            toolDuration: durationMs,
            content: output !== undefined ? JSON.stringify(output) : '',
          });
        }
        setActivities(prev =>
          prev.map(a =>
            a.id === id && a.status === 'running'
              ? { ...a, status: success ? ('done' as const) : ('error' as const), durationMs }
              : a,
          ),
        );
      },
      onTokens(count: number) {
        setTokens(prev => prev + count);
      },
      onComplete(_result?: string) {
        setAgentState(AgentState.COMPLETED);
        setActivities([]);
        abortRef.current = null;
      },
      onError(error: string) {
        setAgentState(AgentState.FAILED);
        setActivities([]);
        abortRef.current = null;
        addLine({ type: 'error', content: error, timestamp: Date.now() });
      },
      async requestApproval(request: ApprovalRequest): Promise<ApprovalAnswer> {
        setAgentState(AgentState.WAITING_FOR_APPROVAL);
        setApproval(request);
        return new Promise(resolve => {
          approvalResolveRef.current = resolve;
        });
      },
    };

    if (isShell) {
      await session.runShell(input, callbacks);
    } else {
      await session.run(input, callbacks);
    }
  }, [isIdle, addLine, updateToolLine, session]);

  const handleCommand = useCallback((cmd: string) => {
    addLine({ type: 'user', content: cmd, timestamp: Date.now() });

    const base = cmd.split(/\s+/)[0]?.toLowerCase() ?? '';
    switch (base) {
      case '/clear':
        setLines([]);
        setActivities([]);
        break;
      case '/exit':
        exit();
        break;
      case '/help':
        setLines(prev => [
          ...prev,
          { id: nextId(), type: 'info', content: 'Navigation: /help /clear /reset /model /status /config', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Agent:      /memory /search /files /workspace /session', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Dev:        /run /git /diff /permissions /undo /exit', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Prefix:     ! shell command  @ file reference', timestamp: Date.now() },
        ]);
        break;
      case '/status':
        setLines(prev => [
          ...prev,
          { id: nextId(), type: 'success', content: `ForgeCode running · Model: ${model} · Tools: filesystem, shell, git`, timestamp: Date.now() },
        ]);
        break;
      default:
        // Forward unknown slash commands to agent (user line already added)
        void handleSubmit(cmd, false, true);
        break;
    }
  }, [addLine, exit, model, handleSubmit]);

  const isInputDisabled =
    agentState !== AgentState.IDLE &&
    agentState !== AgentState.COMPLETED &&
    agentState !== AgentState.FAILED &&
    agentState !== AgentState.CANCELLED;

  if (!started) {
    return (
      <StartupScreen model={model} cwd={cwd} onDone={() => setStarted(true)} />
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Header model={model} state={agentState} context={context} />
      <Output lines={lines} />
      <ActivityPanel activities={activities} />
      <StatusBar
        tokens={tokens}
        stepCount={stepCount}
        maxSteps={50}
        elapsedMs={elapsed}
        toolCount={toolCount}
      />
      {approval ? (
        <ApprovalPrompt request={approval} onAnswer={handleApprovalAnswer} />
      ) : (
        <InputBar
          onSubmit={handleSubmit}
          onCommand={handleCommand}
          disabled={isInputDisabled}
          placeholder="Ask ForgeCode anything..."
        />
      )}
    </Box>
  );
}
