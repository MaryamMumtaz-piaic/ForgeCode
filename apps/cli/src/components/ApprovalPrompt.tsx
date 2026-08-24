import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ApprovalRequest {
  toolName: string;
  riskLevel: 'SAFE' | 'APPROVAL' | 'HIGH_RISK';
  description: string;
  input: unknown;
}

export type ApprovalAnswer = 'allow_once' | 'allow_session' | 'deny' | 'cancel';

interface Props {
  request: ApprovalRequest;
  onAnswer: (answer: ApprovalAnswer) => void;
}

export function ApprovalPrompt({ request, onAnswer }: Props) {
  const isHighRisk = request.riskLevel === 'HIGH_RISK';
  const borderColor = isHighRisk ? 'red' : 'yellow';

  useInput((input) => {
    switch (input.toLowerCase()) {
      case 'y': onAnswer('allow_once'); break;
      case 'a': if (!isHighRisk) onAnswer('allow_session'); break;
      case 'n': onAnswer('deny'); break;
      case 'c': onAnswer('cancel'); break;
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Text bold color={borderColor}>
        {isHighRisk ? '⚠  CAUTION — HIGH RISK' : 'ACTION REQUIRES APPROVAL'}
      </Text>
      <Text> </Text>
      <Text>Tool: <Text bold>{request.toolName}</Text></Text>
      <Text>Risk: <Text color={borderColor}>{request.riskLevel}</Text></Text>
      <Text> </Text>
      <Text dimColor>{request.description}</Text>
      <Text> </Text>
      <Text color="green">[Y] Allow once</Text>
      {!isHighRisk && <Text color="green">[A] Allow for this session</Text>}
      <Text color="red">[N] Deny</Text>
      <Text color="gray">[C] Cancel task</Text>
    </Box>
  );
}
