# ForgeCode Agent Architecture

## What ForgeCode Is

ForgeCode is an **autonomous agent runtime** — not a chatbot. The terminal UI is just the interface. The real product is the stateful agent loop that understands context, plans work, selects tools, executes actions, recovers from failures, and verifies results.

---

## Agent Execution Loop

Every user request flows through this loop until the task is complete or cancelled:

```
USER REQUEST
      ↓
UNDERSTAND       ← parse intent, clarify ambiguity
      ↓
PLAN             ← break into ordered steps
      ↓
INSPECT          ← gather environment context
      ↓
SELECT TOOLS     ← choose tools from registry
      ↓
EXECUTE          ← run tool via permission engine
      ↓
OBSERVE          ← parse structured result
      ↓
REASON           ← update task state, decide next action
      ↓
CONTINUE / ASK   ← continue autonomously or pause for approval
      ↓
VERIFY           ← confirm task objective is met
      ↓
FINAL REPORT     ← concise outcome summary
```

The loop is bounded by configurable limits:

| Limit | Default | Env var |
|---|---|---|
| Max agent steps | 50 | `MAX_AGENT_STEPS` |
| Max tool calls | 100 | `MAX_TOOL_CALLS` |
| Max execution time | 30 minutes | `MAX_EXECUTION_TIME` |

---

## Agent States

```
IDLE               Agent is waiting for input
THINKING           LLM is reasoning
PLANNING           Building a step plan
SEARCHING          Running search tools
READING            Reading files or context
EDITING            Applying file patches
EXECUTING          Running shell commands
WAITING_FOR_APPROVAL  Paused — user must confirm
VERIFYING          Checking task completion
COMPLETED          Task finished successfully
FAILED             Task failed after recovery attempts
CANCELLED          User cancelled
```

---

## Tool Registry

All tools are registered centrally. Every tool implements:

```ts
interface AgentTool {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  permission: PermissionLevel;
  execute(input: unknown): Promise<ToolResult>;
}
```

### Tool Namespaces

| Namespace | Tools |
|---|---|
| `filesystem.*` | list, search, read, write, edit, createFile, createDirectory, move, copy, rename, delete, metadata, diskUsage, findDuplicates |
| `shell.*` | execute |
| `git.*` | status, diff, log, branch, checkout, createBranch, add, commit, restore, stash, merge |
| `file.*` | edit (patch-based), diff, history |
| `task.*` | create, update, list, cancel, complete |
| `agent.*` | create, run, stop, list |
| `memory.*` | read, write, clear |
| `mcp.*` | tool calls forwarded from connected MCP servers |
| `browser.*` | (Phase 4) |

---

## Permission Engine

Three tiers control what the agent can do without asking:

### SAFE — auto-execute
- `filesystem.list`, `filesystem.search`, `filesystem.read`, `filesystem.metadata`
- `git.status`, `git.diff`, `git.log`
- `shell.execute` with read-only commands (e.g. `pnpm test`, `npm test`)

### APPROVAL — ask user (depends on `approvalMode`)
- `filesystem.write`, `filesystem.edit`, `filesystem.move`, `filesystem.copy`, `filesystem.rename`
- `filesystem.createFile`, `filesystem.createDirectory`
- `git.add`, `git.commit`, `git.stash`
- Package installation commands

### HIGH_RISK — always confirm explicitly
- `filesystem.delete` (any)
- Recursive deletion
- System/registry modification
- Service or firewall changes
- Credential access
- Production deployment
- `git push --force`

Approval prompt format:

```
┌───────────────────────────────────────────────┐
│             ACTION REQUIRES APPROVAL          │
├───────────────────────────────────────────────┤
│ Tool: filesystem.move                         │
│                                               │
│ Source:   C:\Downloads\project.zip            │
│ Dest:     C:\Projects\project.zip             │
│                                               │
│ [Y] Allow once                                │
│ [A] Always allow this session                 │
│ [N] Deny                                      │
│ [C] Cancel task                               │
└───────────────────────────────────────────────┘
```

---

## AI Provider Abstraction

The agent runtime is not coupled to any single AI provider.

```ts
interface AIProvider {
  stream(input: AgentInput): AsyncIterable<ModelEvent>;
  generate(input: AgentInput): Promise<ModelResponse>;
}
```

Default provider: **OpenAI GPT-4.1-mini**

Future providers: Anthropic, Google, Ollama, local models, any OpenAI-compatible API.

Config via environment:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

---

## Context Engine

The context engine controls what is sent to the model. It does NOT blindly dump files.

Pipeline:

```
Repository
 ↓ File Discovery
 ↓ Ignore Rules (.gitignore, node_modules, dist, .next, .venv, build, .git)
 ↓ Language Detection
 ↓ Symbol Extraction (Tree-sitter)
 ↓ Dependency Graph
 ↓ Lexical Search (ripgrep)
 ↓ Relevance Ranking
 ↓ LLM Context Window
```

Sensitive files (`.env`, `.env.local`, credentials, private keys, SSH keys, tokens, passwords) are **never** sent to the model without explicit user permission.

---

## Custom Agents

Users can define custom agents stored locally as JSON:

```json
{
  "name": "security-auditor",
  "description": "Audits repositories for security vulnerabilities",
  "instructions": "...",
  "tools": ["filesystem.search", "filesystem.read", "shell.execute"],
  "permissions": {
    "filesystem.write": false
  },
  "model": "gpt-4.1-mini",
  "maxSteps": 30
}
```

Built-in agents:

- General Coding Agent
- Code Reviewer
- Debugging Agent
- Test Fixer
- Refactoring Agent
- Security Auditor
- DevOps Agent
- Documentation Agent
- Research Agent
- File Organizer

---

## Agent Scheduling

Agents can run on a schedule:

| Mode | Description |
|---|---|
| `once` | Run one time |
| `interval` | Run every N minutes |
| `cron` | Standard cron expression |
| `watch` | Trigger on file changes |
| `event-based` | Trigger on system events |

---

## Background Agents

```bash
forge --background
```

Background agents run independently. Each exposes:

- Status
- Last execution timestamp
- Next execution timestamp
- Tasks completed
- Failure count
- Token usage
- Tool call count

---

## Multi-Agent Orchestration (Phase 4)

```
            Master Agent
                 │
  ┌──────────────┼──────────────┐
  │              │              │
Research       Coding         Testing
  │              │              │
  └──────────────┼──────────────┘
                 │
            Review Agent
                 │
              Result
```

The master agent delegates specialized tasks to sub-agents rather than attempting everything itself.

---

## Session Memory

Memory layers:

| Layer | Scope | Persisted |
|---|---|---|
| Session memory | Current terminal session | No |
| Project memory | Per working directory | Yes (SQLite) |
| Agent memory | Per agent definition | Yes (SQLite) |
| Task memory | Per task execution | Yes (SQLite) |
| Tool history | All tool calls | Yes (SQLite) |

Accessible via `/memory` command.

Secrets and credentials are **never** stored in memory.

---

## Undo / Rollback

Every task creates a checkpoint before making modifications:

```
Create checkpoint
      ↓
Execute changes
      ↓
Validate
      ↓
Commit checkpoint (or rollback on failure)
```

- Git repositories: Git-based checkpoints (branches/stashes).
- Non-Git directories: operation journal with before-state snapshots.

---

## Observability

Every task execution produces a structured trace:

```
Task Trace

Step 1  filesystem.search     182ms
Step 2  filesystem.read        21ms
Step 3  shell.execute           4.2s
Step 4  file.edit              14ms
Step 5  shell.execute           8.1s

Total: 12.5s  |  23,481 tokens  |  $0.012
```

Accessible via `/trace` command.

Tracked fields:

- Task ID, Agent ID, Model
- Tokens used, estimated cost
- Tool calls (name, duration, result)
- Files read, files modified
- Shell commands executed
- Total execution time
- Errors and recovery attempts
- Approval requests and decisions
- Final outcome

---

## MCP Integration

ForgeCode connects to MCP servers to extend its tool set:

```bash
forge mcp list
forge mcp add github
forge mcp remove github
```

MCP tools are exposed through the same `AgentTool` interface as built-in tools. The model only sees tools available to the current agent context.

---

## Repository Auto-Detection

When `forge` is launched inside a directory, the context engine automatically detects:

```
Framework      (Next.js, Express, Django, FastAPI, ...)
Language       (TypeScript, Python, JavaScript, ...)
Package manager  (pnpm, npm, yarn, pip, ...)
Git repository
Entry points
Test runner    (Vitest, Jest, Pytest, ...)
Build system
Configuration files
Environment setup
```

---

## Error Recovery

The agent does not give up after one failure. It applies bounded retry/recovery:

```
Command failed
      ↓
Analyze failure
      ↓
Determine root cause
      ↓
Attempt fix (up to N retries)
      ↓
Re-execute
      ↓
Verify success or escalate
```

Recovery is bounded — the agent will not loop indefinitely.
