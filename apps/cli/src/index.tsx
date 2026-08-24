#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { App } from './components/App.js';
import { ForgeSession } from './session.js';
import { ApprovalMode } from '@forgecode/permission-engine';

program
  .name('forge')
  .description('ForgeCode — Autonomous AI coding and computer agent')
  .version('0.1.0')
  .argument('[task]', 'Run a one-shot task inline')
  .option('--model <model>', 'AI model', process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini')
  .option('--auto', 'Autonomous mode — no approval prompts')
  .option('--readonly', 'Read-only mode')
  .option('--cwd <path>', 'Working directory', process.cwd());

program
  .command('doctor')
  .description('Check system requirements and configuration')
  .action(async () => {
    const { runDoctor } = await import('./commands/doctor.js');
    process.exit(await runDoctor());
  });

program
  .command('task')
  .description('Manage tasks')
  .argument('[action]', 'list | cancel', 'list')
  .option('--status <status>', 'Filter by status')
  .action(async (action: string, opts: { status?: string }) => {
    const { listTasks } = await import('./commands/tasks.js');
    if (action === 'list') await listTasks(opts.status);
  });

program
  .command('agent')
  .description('Manage agents')
  .argument('[action]', 'list | create', 'list')
  .action(async (action: string) => {
    const { listAgents } = await import('./commands/agents.js');
    if (action === 'list') listAgents();
  });

program.parse();

const opts = program.opts<{
  model: string;
  auto?: boolean;
  readonly?: boolean;
  cwd: string;
}>();
const args = program.args;

// Only launch interactive UI if no subcommand was matched
const subcommands = ['doctor', 'task', 'agent', 'mcp', 'config'];
if (!subcommands.includes(args[0] ?? '')) {
  if (!process.env['OPENAI_API_KEY']) {
    console.error('Error: OPENAI_API_KEY is not set. Run: forge doctor');
    process.exit(1);
  }

  const approvalMode = opts.auto
    ? ApprovalMode.AUTO
    : opts.readonly
    ? ApprovalMode.READONLY
    : ApprovalMode.BALANCED;

  const session = new ForgeSession(opts.cwd, opts.model, approvalMode);
  render(<App session={session} model={opts.model} cwd={opts.cwd} />, {
    exitOnCtrlC: false,
  });
}
