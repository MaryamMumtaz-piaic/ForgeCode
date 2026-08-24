import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';
import { Header } from './Header.js';
import { Output, OutputLine } from './Output.js';
import { ActivityPanel, ToolActivity } from './ActivityPanel.js';
import { ThinkingBanner } from './ThinkingBanner.js';
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

  // Startup state
  const [started, setStarted] = useState(false);

  // Workspace context
  const [context, setContext] = useState<WorkspaceContext>({
    cwd,
    workspaceName: cwd.split(/[\\/]/).filter(Boolean).pop() ?? cwd,
    isGitRepo: false,
  });

  // Agent state
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const agentStateRef = useRef(agentState);
  agentStateRef.current = agentState;

  // Conversation
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [hasMessages, setHasMessages] = useState(false);

  // Activity tracking
  const [activities, setActivities] = useState<ToolActivity[]>([]);
  const [tokens, setTokens] = useState(0);
  const [toolCount, setToolCount] = useState(0);

  // Per-run elapsed timer (resets each submission)
  const [runStart, setRunStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Approval flow
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const approvalResolveRef = useRef<((a: ApprovalAnswer) => void) | null>(null);

  // Abort control
  const abortRef = useRef<AbortController | null>(null);
  const toolLineMap = useRef<Map<string, string>>(new Map());

  // Detect workspace context after startup completes
  useEffect(() => {
    if (!started) return;
    detectContext(cwd).then(ctx => setContext(ctx)).catch(() => {});
  }, [started, cwd]);

  // Per-run elapsed timer
  useEffect(() => {
    if (runStart === null) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(Date.now() - runStart), 200);
    return () => clearInterval(t);
  }, [runStart]);

  const addLine = useCallback((line: Omit<OutputLine, 'id'>) => {
    setLines(prev => [...prev.slice(-300), { ...line, id: nextId() }]);
  }, []);

  const updateToolLine = useCallback((lineId: string, updates: Partial<OutputLine>) => {
    setLines(prev => prev.map(l => l.id === lineId ? { ...l, ...updates } : l));
  }, []);

  useInput((_input, key) => {
    if (key.ctrl && _input === 'c') {
      if (abortRef.current) {
        abortRef.current.abort();
        addLine({ type: 'error', content: 'Cancelled.', timestamp: Date.now() });
        setAgentState(AgentState.CANCELLED);
        setActivities([]);
        setRunStart(null);
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
    return s === AgentState.IDLE || s === AgentState.COMPLETED
        || s === AgentState.FAILED || s === AgentState.CANCELLED;
  }, []);

  const handleSubmit = useCallback(async (input: string, isShell = false, skipUserLine = false) => {
    if (!isIdle()) return;

    if (!skipUserLine) {
      addLine({ type: 'user', content: isShell ? `! ${input}` : input, timestamp: Date.now() });
    }
    if (!hasMessages) setHasMessages(true);

    setAgentState(AgentState.THINKING);
    setActivities([]);
    setToolCount(0);
    setRunStart(Date.now());
    toolLineMap.current.clear();

    const abort = new AbortController();
    abortRef.current = abort;

    const callbacks = {
      signal: abort.signal,
      onStateChange(state: AgentState) { setAgentState(state); },
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
        setLines(prev => [...prev, {
          id: lineId,
          type: 'tool' as const,
          toolName: name,
          toolInput,
          toolStatus: 'running' as const,
          content: '',
          timestamp: Date.now(),
        }]);
        setActivities(prev => [...prev, { id, name, status: 'running' as const }]);
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
          prev.map(a => a.id === id && a.status === 'running'
            ? { ...a, status: success ? ('done' as const) : ('error' as const), durationMs }
            : a,
          ),
        );
      },
      onTokens(count: number) { setTokens(prev => prev + count); },
      onComplete(_result?: string) {
        setAgentState(AgentState.COMPLETED);
        setActivities([]);
        setRunStart(null);
        abortRef.current = null;
      },
      onError(error: string) {
        setAgentState(AgentState.FAILED);
        setActivities([]);
        setRunStart(null);
        abortRef.current = null;
        addLine({ type: 'error', content: error, timestamp: Date.now() });
      },
      async requestApproval(request: ApprovalRequest): Promise<ApprovalAnswer> {
        setAgentState(AgentState.WAITING_FOR_APPROVAL);
        setApproval(request);
        return new Promise(resolve => { approvalResolveRef.current = resolve; });
      },
    };

    if (isShell) {
      await session.runShell(input, callbacks);
    } else {
      await session.run(input, callbacks);
    }
  }, [isIdle, hasMessages, addLine, updateToolLine, session]);

  const handleCommand = useCallback((cmd: string) => {
    addLine({ type: 'user', content: cmd, timestamp: Date.now() });
    if (!hasMessages) setHasMessages(true);

    const base = cmd.split(/\s+/)[0]?.toLowerCase() ?? '';
    switch (base) {
      case '/clear':
        setLines([]);
        setActivities([]);
        setHasMessages(false);
        break;
      case '/exit':
        exit();
        break;
      case '/help':
        setLines(prev => [
          ...prev,
          { id: nextId(), type: 'info', content: 'Agent:      /agent /agent new /agent list /agent run /loop /resume', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Tasks:      /task /task new /task list /task cancel', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Workspace:  /workspace /workspace open /workspace list', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Files:      /files /search /diff /undo', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Git:        /git /git status /git log /git diff', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Shell:      /run <command>   or prefix message with !', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Config:     /model /permissions /memory /config', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'Session:    /session /session new /session list /session switch', timestamp: Date.now() },
          { id: nextId(), type: 'info', content: 'General:    /status /clear /reset /exit', timestamp: Date.now() },
        ]);
        break;
      case '/status':
        setLines(prev => [
          ...prev,
          { id: nextId(), type: 'success', content: `Ready · model: ${model} · tools: filesystem, shell, git`, timestamp: Date.now() },
        ]);
        break;
      case '/reset':
        setLines([]);
        setActivities([]);
        setTokens(0);
        setToolCount(0);
        setHasMessages(false);
        setAgentState(AgentState.IDLE);
        break;
      default:
        // Forward to agent with user line already added
        void handleSubmit(cmd, false, true);
        break;
    }
  }, [addLine, hasMessages, exit, model, handleSubmit]);

  const isInputDisabled =
    agentState !== AgentState.IDLE &&
    agentState !== AgentState.COMPLETED &&
    agentState !== AgentState.FAILED &&
    agentState !== AgentState.CANCELLED;

  const hasActiveTools = activities.some(a => a.status === 'running');

  // Startup screen
  if (!started) {
    return <StartupScreen model={model} cwd={cwd} onDone={() => setStarted(true)} />;
  }

  return (
    <Box flexDirection="column" height="100%">
      <Header state={agentState} context={context} compact={hasMessages} />
      <Output lines={lines} />
      <ThinkingBanner state={agentState} hasActiveTools={hasActiveTools} />
      <ActivityPanel activities={activities} />
      <StatusBar
        model={model}
        tokens={tokens}
        toolCount={toolCount}
        elapsedMs={elapsed}
        agentState={agentState}
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
