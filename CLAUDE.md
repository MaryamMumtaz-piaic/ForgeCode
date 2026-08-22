# ForgeCode — Claude Code Instructions

## Project Identity

**ForgeCode** is a production-grade Windows-native autonomous AI coding and computer automation agent. It is NOT a chatbot. It is a stateful agent runtime with a terminal interface.

Core principle: the terminal is only the interface. The real product is the agent runtime, filesystem intelligence, tool system, permission engine, context engine, task engine, custom-agent system, and autonomous execution loop.

---

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js |
| Terminal UI | Ink + React |
| Schema validation | Zod |
| AI Provider | OpenAI SDK (abstracted) |
| Shell execution | execa |
| Code parsing | Tree-sitter |
| File search | ripgrep |
| Persistence | SQLite (with FTS5) |
| VCS | Git |
| Tool protocol | MCP |

---

## Monorepo Structure

```
forgecode/
├── apps/
│   └── cli/              # Ink/React terminal UI entry point
│
├── packages/
│   ├── agent-runtime/    # Core agent loop, planner, state machine
│   ├── ai-provider/      # AI provider abstraction (OpenAI, Anthropic, etc.)
│   ├── tool-runtime/     # Unified tool registry & execution engine
│   ├── filesystem/       # Filesystem tools (list, read, write, move, etc.)
│   ├── shell/            # PowerShell / CMD / Git Bash execution
│   ├── git/              # Git integration tools
│   ├── context-engine/   # Codebase indexing, symbol extraction, relevance
│   ├── permission-engine/ # Permission levels, approval flows
│   ├── task-engine/      # Persistent task manager (SQLite)
│   ├── agent-manager/    # Custom agent definitions & lifecycle
│   ├── memory/           # Session, project, agent memory
│   ├── mcp/              # MCP server connections and tool bridge
│   └── telemetry/        # Structured execution traces
│
├── .forge/               # Project-level config and instructions
├── tests/
└── docs/
```

---

## Development Rules

### Architecture
- Every tool must implement `AgentTool` interface with `name`, `description`, `inputSchema` (Zod), `permission`, and `execute`.
- Never allow the LLM to directly manipulate the OS — all operations go through typed tools.
- AI provider must be abstracted behind `AIProvider` interface. Never couple to one provider.
- Use clean package boundaries — no cross-package imports that bypass the public API.
- Do not create monolithic files. Keep each concern in its own package/module.

### Windows
- This application is **Windows-first**. Always use Windows-native paths (`C:\...`).
- Never assume `/`, `~/`, or `/bin/bash` exist.
- Use PowerShell as the default shell. Support CMD and Git Bash as alternatives.
- Normalize paths internally but preserve Windows-native format in the UI.

### Security & Permissions
- Three permission tiers: `SAFE` (auto-execute), `APPROVAL` (ask user), `HIGH_RISK` (always confirm).
- Never execute `delete`, `recursive delete`, or system/registry modifications without explicit confirmation.
- Never expose `OPENAI_API_KEY` or any credential to the terminal UI or logs.
- Read `.env` / credential files only with explicit user permission.
- Validate and sanitize all paths before execution.

### AI / Agent Loop
- Implement the full agent loop: Understand → Plan → Inspect → Select Tools → Execute → Observe → Reason → Continue/Ask → Verify → Report.
- Add configurable limits: `MAX_AGENT_STEPS`, `MAX_TOOL_CALLS`, `MAX_EXECUTION_TIME`.
- Implement bounded retry/recovery. The agent must not give up after one failure.
- Support `AbortController`-based cancellation throughout — LLM requests, tools, shell processes, and the agent loop itself.
- All agent execution must produce structured telemetry (task ID, tokens, cost, tool calls, duration, errors).

### Terminal UI
- Use Ink + React. Keep the UI clean — no excessive borders, no fake ASCII art, no placeholder activity.
- Everything displayed in the UI must be connected to the real backend.
- Streaming responses and streaming tool output are required.
- Agent states: `IDLE`, `THINKING`, `PLANNING`, `SEARCHING`, `READING`, `EDITING`, `EXECUTING`, `WAITING_FOR_APPROVAL`, `VERIFYING`, `COMPLETED`, `FAILED`, `CANCELLED`.

### File Editing
- Prefer patch-based editing (structured diffs) over full file rewrites.
- Show diff view (before/after) for every file modification.
- Support undo/redo and rollback per task.
- For Git repos: use Git-based checkpoints. For non-Git directories: use an operation journal.

### Code Quality
- Strong TypeScript types everywhere — no `any`.
- Zod for all external input validation (tool inputs, config, API responses).
- Structured errors — never throw raw strings.
- API retry/backoff with rate-limit handling.
- Graceful shutdown — clean up all child processes on exit.

---

## Environment Variables

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
MAX_AGENT_STEPS=50
MAX_TOOL_CALLS=100
MAX_EXECUTION_TIME=30m
```

---

## Key Interfaces

```ts
interface AIProvider {
  stream(input: AgentInput): AsyncIterable<ModelEvent>;
  generate(input: AgentInput): Promise<ModelResponse>;
}

interface AgentTool {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  permission: PermissionLevel;
  execute(input: unknown): Promise<ToolResult>;
}
```

---

## Project Config Files

- Global config: `~/.forgecode/config.json`
- Project config: `.forge/config.json`
- Project instructions: `.forge/instructions.md`

Project config always overrides global config.

---

## Command Reference

```bash
forge                            # Launch interactive agent
forge "fix my project"           # Inline task
forge --auto "implement auth"    # Autonomous mode (no approvals)
forge --readonly "analyze repo"  # Read-only mode
forge --background               # Background agent mode
forge --model gpt-4.1-mini       # Override model

forge task list|create|cancel
forge agent list|create|run
forge mcp list|add|remove
forge config
forge permissions
forge doctor
```

---

## Implementation Phases

| Phase | Scope |
|---|---|
| 1 | CLI, OpenAI, agent loop, filesystem read/search, shell, file editing, permissions |
| 2 | Git, task system, persistent sessions, context engine, project instructions, rollback |
| 3 | Custom agents, agent builder, MCP, background agents, scheduled loops, memory |
| 4 | Multi-agent orchestration, browser automation, Docker sandbox, observability, remote agents |

---

## Definition of Done

ForgeCode is functional only when this real-world scenario works end-to-end with no simulated data:

1. User runs `forge` in a project directory.
2. User asks: _"Analyze this project and fix the failing tests."_
3. Agent scans, understands architecture, runs tests, receives real failures.
4. Agent searches relevant files, edits with real patches, reruns tests.
5. Agent runs build/lint, displays actual diff, asks commit approval.
6. User approves. Agent creates a real Git commit. Agent reports real result.
