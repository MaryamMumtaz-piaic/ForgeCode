import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import { AgentState } from '@forgecode/agent-runtime';
import { Header } from './Header.js';
import { Output, OutputLine } from './Output.js';
import { ActivityPanel, ToolActivity } from './ActivityPanel.js';
import { StatusBar } from './StatusBar.js';
import { InputBar } from './InputBar.js';
import { ApprovalPrompt, ApprovalAnswer, ApprovalRequest } from './ApprovalPrompt.js';
import { ForgeSession } from '../session.js';

interface Props {
  session: ForgeSession;
  model: string;
  cwd: string;
}

export function App({ session, model, cwd }: Props) {
  const { exit } = useApp();
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [activities, setActivities] = useState<ToolActivity[]>([]);
  const [tokens, setTokens] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const approvalResolveRef = useRef<((answer: ApprovalAnswer) => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const addLine = useCallback((line: OutputLine) => {
    setLines(prev => [...prev.slice(-200), line]);
  }, []);

  useInput((_input, key) => {
    if (key.ctrl && _input === 'c') {
      if (abortRef.current) {
        abortRef.current.abort();
        addLine({ type: 'error', content: 'Cancelled.' });
        setAgentState(AgentState.CANCELLED);
      } else {
        exit();
      }
    }
    if (key.ctrl && _input === 'l') {
      setLines([]);
    }
  });

  const handleApprovalAnswer = useCallback((answer: ApprovalAnswer) => {
    setApproval(null);
    setAgentState(AgentState.EXECUTING);
    approvalResolveRef.current?.(answer);
    approvalResolveRef.current = null;
  }, []);

  const handleSubmit = useCallback(async (input: string) => {
    if (agentState !== AgentState.IDLE && agentState !== AgentState.COMPLETED &&
        agentState !== AgentState.FAILED && agentState !== AgentState.CANCELLED) {
      return;
    }

    addLine({ type: 'user', content: input });
    setAgentState(AgentState.THINKING);
    setActivities([]);
    setStepCount(0);

    const abort = new AbortController();
    abortRef.current = abort;

    await session.run(input, {
      signal: abort.signal,
      onStateChange(state) {
        setAgentState(state);
      },
      onTextDelta(delta) {
        setLines(prev => {
          const last = prev[prev.length - 1];
          if (last?.type === 'agent') {
            return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
          }
          return [...prev, { type: 'agent', content: delta }];
        });
      },
      onToolStart(name) {
        setActivities(prev => [...prev, { name, status: 'running' }]);
        setStepCount(n => n + 1);
        addLine({ type: 'tool', toolName: name, content: '' });
      },
      onToolEnd(name, durationMs, success) {
        setActivities(prev =>
          prev.map(a =>
            a.name === name && a.status === 'running'
              ? { ...a, status: success ? 'done' : 'error', durationMs }
              : a,
          ),
        );
      },
      onTokens(count) {
        setTokens(prev => prev + count);
      },
      onComplete(result) {
        setAgentState(AgentState.COMPLETED);
        abortRef.current = null;
        if (result) addLine({ type: 'success', content: result });
      },
      onError(error) {
        setAgentState(AgentState.FAILED);
        abortRef.current = null;
        addLine({ type: 'error', content: error });
      },
      async requestApproval(request): Promise<ApprovalAnswer> {
        setAgentState(AgentState.WAITING_FOR_APPROVAL);
        setApproval(request);
        return new Promise(resolve => {
          approvalResolveRef.current = resolve;
        });
      },
    });
  }, [agentState, session, addLine]);

  const isInputDisabled =
    agentState !== AgentState.IDLE &&
    agentState !== AgentState.COMPLETED &&
    agentState !== AgentState.FAILED &&
    agentState !== AgentState.CANCELLED;

  return (
    <Box flexDirection="column" height="100%">
      <Header model={model} state={agentState} cwd={cwd} />
      <Output lines={lines} />
      <ActivityPanel activities={activities} />
      <StatusBar tokens={tokens} stepCount={stepCount} maxSteps={50} elapsedMs={elapsed} />
      {approval ? (
        <ApprovalPrompt request={approval} onAnswer={handleApprovalAnswer} />
      ) : (
        <InputBar onSubmit={handleSubmit} disabled={isInputDisabled} placeholder="Ask ForgeCode anything..." />
      )}
    </Box>
  );
}
