# ForgeCode

> **A software engineer living inside your terminal.**

ForgeCode is a production-grade Windows-native autonomous AI coding and computer automation agent. It combines the capabilities of a coding agent, terminal, file manager, task runner, and custom agent platform — all driven by a real stateful agent runtime.

---

## What ForgeCode Is Not

ForgeCode is **not** a chatbot that executes commands.

It is an **autonomous agent runtime with a terminal interface**.

```
User
 ↓
Agent Runtime
 ↓
Planner → Context Engine → Tool Router → Permission Engine
 ↓
Tool Execution → Observation → Agent Loop
```

---

## What You Can Do

```bash
> Analyze my C drive and find all large development projects.

> Create a Next.js project in C:\Projects\AIApp.

> Find why my application is failing and fix it.

> Move all screenshots from Downloads into C:\Users\Me\Pictures\Screenshots.

> Create an agent that monitors my project tests and automatically fixes failures.

> Organize my Downloads folder by file type.

> Run tests, fix all failures, and create a commit.
```

---

## Quick Start

```bash
# Install
npm install -g forgecode

# Configure
forge config

# Run
forge
```

Set your API key:

```env
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

Run the health check:

```bash
forge doctor
```

---

## Terminal UI

```
┌──────────────────────────────────────────────────────────────┐
│ FORGECODE                              GPT-4.1-mini   ● READY │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  > Analyze my project and fix the failing tests              │
│                                                              │
│  ✓ Repository scanned                                        │
│  ✓ package.json analyzed                                     │
│  ✓ 143 files indexed                                         │
│  ✓ Tests executed                                            │
│                                                              │
│  ⚡ Agent Activity                                           │
│  ├─ filesystem.search                                        │
│  ├─ filesystem.read                                          │
│  ├─ shell.execute                                            │
│  ├─ file.edit                                                │
│  └─ shell.execute                                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ C:\Projects\my-app                                           │
│ > _                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Features

### Filesystem Intelligence
Full read/write access to the Windows filesystem with search, metadata, diff, and duplicate detection across any drive.

### Shell Execution
Supports PowerShell, CMD, Git Bash, Node.js, Python, npm, pnpm, yarn, git, docker, and more.

### AI-Aware File Editor
Patch-based editing with diff view, undo/redo, and per-task rollback.

### Permission Engine
Three-tier permission system: auto-execute safe ops, ask approval for writes, always confirm destructive ops.

### Task System
Persistent task manager with live progress tracking, step history, and task recovery across terminal restarts.

### Git Integration
Full Git workflow — status, diff, branch, commit, stash, merge — with approval gates before destructive operations.

### Custom Agents
Create, configure, and schedule your own agents with defined tools, permissions, and missions.

### Agent Loops
Schedule agents on intervals, cron, file-watch triggers, or event-based conditions.

### Background Agents
Run agents as background processes that monitor your projects continuously.

### MCP Support
Connect external MCP servers to expand the tool set (GitHub, PostgreSQL, Playwright, custom servers, and more).

### Session Memory
Persistent memory per session, project, agent, and task — stored locally in SQLite.

### Observability
Structured execution traces with token usage, cost estimates, tool call timelines, and error logs.

---

## CLI Reference

```bash
forge                            # Interactive agent
forge "fix my project"           # Inline task
forge --auto "implement auth"    # Autonomous (no approval prompts)
forge --readonly "analyze repo"  # Read-only mode
forge --background               # Launch background agent
forge --model gpt-4.1-mini       # Override model

forge task list
forge task create
forge task cancel

forge agent list
forge agent create
forge agent run

forge mcp list
forge mcp add <server>
forge mcp remove <server>

forge config
forge permissions
forge doctor
```

### In-session commands

```
/help          Show help
/status        Current agent status
/tasks         Task list
/agents        Agent list
/memory        Inspect memory
/tools         Tool registry
/mcp           MCP connections
/model         Switch model
/config        Configuration
/permissions   Permission settings
/history       Command history
/trace         Current task trace
/diff          Pending file changes
/commit        Commit changes
/undo          Undo last action
/redo          Redo
/clear         Clear output
/exit          Exit
```

---

## Configuration

Global config: `~/.forgecode/config.json`
Project config: `.forge/config.json` (overrides global)
Project instructions: `.forge/instructions.md`

```json
{
  "model": "gpt-4.1-mini",
  "provider": "openai",
  "approvalMode": "balanced",
  "maxSteps": 50,
  "maxToolCalls": 100,
  "shell": "powershell"
}
```

`approvalMode` options:
- `"balanced"` — ask for writes, auto-execute reads
- `"strict"` — ask for every tool call
- `"auto"` — autonomous (use with care)

---

## Architecture

```
forgecode/
├── apps/
│   └── cli/                  # Ink/React terminal UI
│
├── packages/
│   ├── agent-runtime/        # Agent loop, planner, state machine
│   ├── ai-provider/          # AIProvider abstraction
│   ├── tool-runtime/         # Unified tool registry
│   ├── filesystem/           # Filesystem tools
│   ├── shell/                # Shell execution
│   ├── git/                  # Git tools
│   ├── context-engine/       # Codebase indexing & relevance
│   ├── permission-engine/    # Permission levels & approval UI
│   ├── task-engine/          # Persistent tasks (SQLite)
│   ├── agent-manager/        # Custom agent definitions
│   ├── memory/               # Session & project memory
│   ├── mcp/                  # MCP server bridge
│   └── telemetry/            # Execution traces
│
└── .forge/                   # Project-level config
```

---

## Tech Stack

| Concern | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Terminal UI | Ink + React |
| Validation | Zod |
| AI | OpenAI SDK (abstracted) |
| Shell | execa |
| Code parsing | Tree-sitter |
| File search | ripgrep |
| Database | SQLite + FTS5 |
| VCS | Git |
| Tools | MCP |

---

## Security

- All filesystem and shell operations go through typed tools — the LLM never manipulates the OS directly.
- Credentials and secrets are never sent to the model or logged.
- Sensitive files (`.env`, private keys, SSH keys) require explicit user permission to read.
- Destructive operations always require explicit confirmation.
- Paths are normalized and validated before execution.
- API keys are loaded from environment variables only — never hardcoded.

---

## Built-in Agents

| Agent | Purpose |
|---|---|
| General Coding Agent | Build, fix, and maintain code |
| Code Reviewer | Review diffs and suggest improvements |
| Debugging Agent | Diagnose and fix runtime errors |
| Test Fixer | Fix failing tests automatically |
| Refactoring Agent | Clean and restructure code |
| Security Auditor | Audit repositories for vulnerabilities |
| DevOps Agent | Manage deployments, CI/CD, containers |
| Documentation Agent | Generate and update docs |
| Research Agent | Investigate code, APIs, and errors |
| File Organizer | Organize directories by type and pattern |

---

## Roadmap

| Phase | Scope |
|---|---|
| Phase 1 | CLI, OpenAI, agent loop, filesystem, shell, file editing, permissions |
| Phase 2 | Git, task system, persistent sessions, context engine, rollback |
| Phase 3 | Custom agents, agent builder, MCP, background agents, scheduled loops, memory |
| Phase 4 | Multi-agent orchestration, browser automation, Docker sandbox, remote agents |

---

## Author

**Maryam Mumtaz**
Full Stack Developer & AI Engineer
Founder, Marsa Empower

- GitHub: [github.com/MaryamMumtaz-piaic](https://github.com/MaryamMumtaz-piaic)
- LinkedIn: [linkedin.com/in/maryammumtaz-](https://www.linkedin.com/in/maryammumtaz-)
- Portfolio: [maryam-piaic.vercel.app](https://maryam-piaic.vercel.app)

---

## License

MIT © 2026 Maryam Mumtaz
