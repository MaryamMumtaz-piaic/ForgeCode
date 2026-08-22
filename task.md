# ForgeCode
## Autonomous Windows AI Coding, Terminal & Computer Agent

## 1. Product Overview

Build a production-grade Windows-native AI coding and computer automation agent named **ForgeCode**.

ForgeCode should combine the capabilities of:

- Claude Code
- Cursor Agent
- OpenAI Codex-style coding agents
- Windows Terminal
- File Manager
- AI task automation
- Custom agent orchestration
- MCP tool execution
- Autonomous agent loops

The product must NOT feel like a normal chatbot.

It must feel like a **professional AI employee living inside the terminal**, capable of understanding the user's computer, inspecting files, editing projects, executing commands, creating files and folders, running development workflows, using external tools, creating custom agents, and autonomously completing multi-step tasks.

The primary interface is a **beautiful terminal-based UI**, not a traditional web chat application.

---

# 2. Primary Goal

The user should be able to open ForgeCode and type:

```text
forge
```

Then interact naturally:

```text
> Analyze my C drive and find all large development projects.
```

or:

```text
> Create a Next.js project in C:\Projects\AIApp.
```

or:

```text
> Find why my application is failing and fix it.
```

or:

```text
> Move all screenshots from Downloads into C:\Users\Sami\Pictures\Screenshots.
```

or:

```text
> Create an agent that monitors my project tests and automatically fixes failures.
```

ForgeCode should understand the request, create an execution plan, inspect the environment, call the appropriate tools, ask for approval when required, execute the task, verify the result, and provide a concise final report.

---

# 3. Core Product Philosophy

ForgeCode should operate around this loop:

```text
USER REQUEST
      ↓
UNDERSTAND
      ↓
PLAN
      ↓
INSPECT
      ↓
SELECT TOOLS
      ↓
EXECUTE
      ↓
OBSERVE RESULT
      ↓
REASON
      ↓
CONTINUE / ASK APPROVAL
      ↓
VERIFY
      ↓
FINAL REPORT
```

Never implement ForgeCode as:

```text
User → LLM → Text Response
```

Implement it as a real stateful agent runtime:

```text
User
 ↓
Agent Runtime
 ↓
Planner
 ↓
Context Engine
 ↓
Tool Router
 ↓
Permission Engine
 ↓
Tool Execution
 ↓
Observation
 ↓
Agent Loop
```

---

# 4. Model Provider

The initial AI provider must use the **OpenAI API**.

Create a clean provider abstraction so the application is not permanently coupled to one provider.

Initial model:

```text
OpenAI GPT-4.1-mini
```

Configuration must come from environment variables:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Do not hardcode API keys.

Create an abstraction similar to:

```ts
interface AIProvider {
  stream(input: AgentInput): AsyncIterable<ModelEvent>;
  generate(input: AgentInput): Promise<ModelResponse>;
}
```

The architecture must allow future providers:

```text
OpenAI
Anthropic
Google
Local Models
Ollama
OpenAI-compatible APIs
```

---

# 5. Terminal UI

The terminal interface is one of the most important parts of the product.

It must feel polished, modern, responsive and professional.

Use a terminal UI framework such as:

```text
Ink
React
TypeScript
```

The interface should have:

```text
┌──────────────────────────────────────────────────────────────┐
│ FORGECODE                              GPT-4.1-mini   ● READY │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent                                                       │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  > Analyze my project and fix the failing tests              │
│                                                              │
│  ✓ Repository scanned                                        │
│  ✓ package.json analyzed                                      │
│  ✓ 143 files indexed                                          │
│  ✓ Tests executed                                             │
│                                                              │
│  ⚡ Agent Activity                                            │
│                                                              │
│  ├─ file.search                                               │
│  ├─ file.read                                                 │
│  ├─ shell.execute                                             │
│  ├─ file.edit                                                 │
│  └─ test.run                                                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ~/Projects/my-app                                             │
│ > _                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

# 6. Terminal UI Features

Implement:

- Streaming AI responses
- Streaming tool execution
- Colored status indicators
- Spinner/progress indicators
- Collapsible tool output
- Command history
- Keyboard shortcuts
- Session history
- Agent activity timeline
- Current working directory
- Current model
- Token/cost information
- Execution duration
- Permission prompts
- Error states
- Success states
- Task progress
- Agent status

Agent states:

```text
IDLE
THINKING
PLANNING
SEARCHING
READING
EDITING
EXECUTING
WAITING_FOR_APPROVAL
VERIFYING
COMPLETED
FAILED
CANCELLED
```

---

# 7. Full Filesystem Access

ForgeCode must be capable of working across the user's Windows filesystem.

The agent should be able to inspect:

```text
C:\
D:\
E:\
```

when available and explicitly authorized.

For C drive:

```text
C:\
├── Users
├── Program Files
├── Program Files (x86)
├── Windows
├── Projects
├── Development
└── ...
```

The agent must be able to:

- List directories
- Search files
- Search directories
- Read files
- Create files
- Edit files
- Rename files
- Move files
- Copy files
- Create directories
- Delete files
- Delete directories
- Inspect metadata
- Calculate file sizes
- Detect duplicate files
- Search by extension
- Search by content
- Search by filename

Example commands:

```text
> Find every TypeScript project on C drive.

> Find all .env files.

> Show me folders larger than 10GB.

> Find all Next.js projects.

> Move these files into my Documents folder.

> Create a new folder called AI Projects.

> Edit the configuration file.

> Rename this project.
```

---

# 8. Filesystem Tool Layer

Do NOT allow the LLM to directly manipulate the OS.

Every operation must go through typed tools.

Create:

```text
filesystem.list
filesystem.search
filesystem.read
filesystem.write
filesystem.edit
filesystem.createFile
filesystem.createDirectory
filesystem.move
filesystem.copy
filesystem.rename
filesystem.delete
filesystem.metadata
filesystem.diskUsage
filesystem.findDuplicates
```

Example:

```ts
filesystem.read({
  path: "C:\\Projects\\app\\package.json"
})
```

Example:

```ts
filesystem.move({
  source: "C:\\Users\\Sami\\Downloads\\file.png",
  destination: "C:\\Users\\Sami\\Pictures\\file.png"
})
```

All paths must be normalized and validated.

---

# 9. Filesystem Security

ForgeCode is powerful, but it must not blindly execute destructive operations.

Implement a permission engine.

### Safe operations

Examples:

```text
list
search
read
metadata
git status
git diff
npm test
pnpm test
```

These can normally execute automatically.

### Approval-required operations

Examples:

```text
write
edit
move
copy
rename
package installation
git commit
```

Depending on the configured permission mode.

### High-risk operations

Always request explicit confirmation by default:

```text
delete
recursive delete
system modification
registry modification
service modification
firewall modification
credential access
production deployment
force push
disk formatting
```

The UI should display:

```text
⚠ APPROVAL REQUIRED

The agent wants to execute:

rm -rf C:\SomeFolder

This will permanently delete:

C:\SomeFolder

Continue?

[Y] Yes
[N] No
[A] Always allow this operation
[C] Cancel task
```

For Windows commands, use PowerShell/Windows-native execution rather than assuming Unix commands exist.

---

# 10. Shell / CMD / PowerShell Agent

ForgeCode must be capable of executing Windows commands.

Support:

```text
PowerShell
CMD
Git Bash
Node.js
Python
npm
pnpm
yarn
git
docker
docker compose
curl
ssh
```

Create:

```text
shell.execute
```

Example:

```ts
shell.execute({
  command: "pnpm test",
  cwd: "C:\\Projects\\my-app",
  timeout: 120000
})
```

Return structured output:

```ts
{
  command: string;
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

The agent must inspect exit codes and output before deciding what to do next.

---

# 11. Command Approval

When executing potentially dangerous commands:

```text
ForgeCode wants to execute:

PowerShell:
Remove-Item -Recurse C:\Projects\old-app

Risk:
HIGH

Reason:
Permanent deletion of directory.

[Allow Once]
[Allow Session]
[Deny]
```

Never silently execute destructive commands unless the user has explicitly configured an unrestricted mode.

---

# 12. File Editor

ForgeCode must have a built-in AI-aware file editor experience.

When the agent modifies a file, show:

```text
FILE EDIT

src/auth/session.ts

- const token = getToken()
- return token
+ const token = await getToken()
+ if (!token) {
+   throw new AuthError()
+ }
+ return token
```

Support:

- Diff view
- Before/after
- Patch application
- Undo
- Redo
- Rollback
- File history
- Change summary

Prefer patch-based editing instead of rewriting complete files.

Create:

```text
file.edit
```

using structured patches.

---

# 13. Task System

ForgeCode must have a persistent task manager.

Example:

```text
TASK #42

Fix authentication system

Status:
IN PROGRESS

Steps:

✓ Inspect repository
✓ Locate authentication module
✓ Reproduce bug
✓ Identify root cause
● Implement fix
○ Run tests
○ Review diff
○ Complete
```

The user can run:

```text
/tasks
```

Show:

```text
Active Tasks
Completed Tasks
Failed Tasks
Scheduled Tasks
Background Tasks
```

Tasks must survive terminal restarts.

---

# 14. Autonomous Agent Loop

Implement an autonomous execution loop.

Example:

```text
while task_not_complete:

    understand_state()

    inspect_environment()

    determine_next_action()

    request_tool()

    execute_tool()

    collect_observation()

    update_state()

    verify_progress()

    if approval_required:
        pause()

    if task_complete:
        finalize()
```

Add configurable limits:

```env
MAX_AGENT_STEPS=50
MAX_TOOL_CALLS=100
MAX_EXECUTION_TIME=30m
```

Prevent infinite loops.

---

# 15. Custom Agents

ForgeCode must allow users to create custom agents.

Example:

```text
/agents
```

Interface:

```text
Custom Agents

1. Code Reviewer
2. Test Fixer
3. DevOps Agent
4. Security Auditor
5. Documentation Agent
6. Custom Agent
```

Create agent:

```text
> Create a Security Auditor agent.

Name:
Security Auditor

Mission:
Analyze repositories for security vulnerabilities.

Tools:
✓ filesystem
✓ shell
✓ git
✓ package scanner

Permission:
Read-only

Model:
GPT-4.1-mini
```

Agent definition should be stored locally.

Example:

```json
{
  "name": "security-auditor",
  "description": "Audits repositories for security vulnerabilities",
  "instructions": "...",
  "tools": [
    "filesystem.search",
    "filesystem.read",
    "shell.execute"
  ],
  "permissions": {
    "filesystem.write": false
  }
}
```

---

# 16. Agent Loops

Users must be able to create recurring agents.

Example:

```text
Create a loop that checks my project every 30 minutes
and fixes failing tests.
```

Configuration:

```text
Agent:
Test Fixer

Schedule:
Every 30 minutes

Directory:
C:\Projects\my-app

Actions:
Run tests
Analyze failures
Fix code
Run tests again
Report result
```

Support:

```text
once
interval
cron
watch
event-based
```

---

# 17. Background Agents

Support:

```bash
forge --background
```

Example:

```text
Background Agents

● Test Monitor
● Dependency Watcher
● Git Monitor
○ Security Auditor
```

Each agent should have:

```text
Status
Last execution
Next execution
Tasks completed
Failures
Token usage
Tool calls
```

---

# 18. MCP Support

Implement MCP support so ForgeCode can connect external tools.

Example:

```text
MCP Servers

✓ GitHub
✓ PostgreSQL
✓ Playwright
✓ Filesystem
✓ Custom Server
```

CLI:

```bash
forge mcp list
forge mcp add github
forge mcp remove github
```

The MCP layer should expose tools to the agent through the same unified tool interface.

---

# 19. Unified Tool Registry

Create a central registry:

```text
Tool Registry

filesystem.*
shell.*
git.*
browser.*
mcp.*
task.*
agent.*
memory.*
```

Every tool should define:

```ts
interface AgentTool {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  permission: PermissionLevel;
  execute(input: unknown): Promise<ToolResult>;
}
```

The model should only see tools that are available to the current agent.

---

# 20. Git Integration

ForgeCode must deeply understand Git.

Support:

```text
git.status
git.diff
git.log
git.branch
git.checkout
git.createBranch
git.add
git.commit
git.restore
git.stash
git.merge
```

Example:

```text
> Fix the bug and commit it.

Agent:

✓ Created branch:
forge/fix-authentication

✓ Fixed authentication
✓ Tests passing
✓ Reviewed diff

Commit:
fix: resolve authentication session bug

Create commit?

[Y] Yes
[N] No
```

Never force-push by default.

---

# 21. Repository Understanding

When entering a project:

```bash
forge
```

ForgeCode should automatically detect:

```text
Framework
Language
Package manager
Git repository
Entry points
Tests
Build system
Configuration
Environment
```

For example:

```text
Project detected

Framework: Next.js
Language: TypeScript
Package Manager: pnpm
Database: PostgreSQL
Git: Enabled
Tests: Vitest
Build: Next.js
```

---

# 22. Codebase Context Engine

Build a context engine that avoids sending unnecessary files to the model.

Pipeline:

```text
Repository
 ↓
File Discovery
 ↓
Ignore Rules
 ↓
Language Detection
 ↓
Symbol Extraction
 ↓
Dependency Graph
 ↓
Lexical Search
 ↓
Relevant Context
 ↓
LLM
```

Respect:

```text
.gitignore
node_modules
.venv
dist
build
.next
.git
```

unless explicitly requested.

Do not automatically read secrets.

Special handling:

```text
.env
.env.local
credentials
private keys
SSH keys
tokens
password files
```

Require explicit permission before exposing sensitive content to the model.

---

# 23. Project Instructions

Support:

```text
.forge/instructions.md
```

Example:

```md
# Project Instructions

Use pnpm.

Never modify database migrations automatically.

Use TypeScript strict mode.

Run tests before completing tasks.

Use existing component patterns.
```

ForgeCode must load these instructions when operating inside the project.

---

# 24. Session Memory

Maintain:

```text
Session
Project Memory
Agent Memory
Task Memory
Tool History
```

Allow:

```text
/memory
```

to inspect memory.

Do not store secrets or credentials.

---

# 25. Undo / Rollback

Every agent task should be recoverable.

Before major modifications:

```text
Create checkpoint
      ↓
Execute changes
      ↓
Validate
      ↓
Commit checkpoint
```

If something fails:

```text
Rollback task
```

Restore the previous state.

For Git repositories, prefer Git-based checkpoints.

For non-Git directories, create a safe operation journal.

---

# 26. Command Palette

Implement:

```text
/help
/status
/tasks
/agents
/memory
/tools
/mcp
/model
/config
/permissions
/history
/clear
/reset
/undo
/redo
/diff
/commit
/exit
```

Use autocomplete.

---

# 27. Interactive Approval UI

The approval system must be elegant.

Example:

```text
┌───────────────────────────────────────────────┐
│             ACTION REQUIRES APPROVAL          │
├───────────────────────────────────────────────┤
│                                               │
│ Tool: filesystem.move                         │
│                                               │
│ Source:                                       │
│ C:\Downloads\project.zip                      │
│                                               │
│ Destination:                                  │
│ C:\Projects\project.zip                       │
│                                               │
│ [Y] Allow once                                │
│ [A] Always allow                              │
│ [N] Deny                                      │
│ [C] Cancel task                               │
│                                               │
└───────────────────────────────────────────────┘
```

---

# 28. Error Recovery

The agent must recover from failures.

Example:

```text
Command failed.

pnpm test

Exit code: 1

Agent:
Analyzing failure...

Found:
Module resolution error.

Attempt 1:
Fix import path.

Running tests...

✓ Passed.
```

The agent should not immediately give up after one failed command.

Implement bounded retry/recovery logic.

---

# 29. Observability

Every agent execution should produce structured telemetry.

Track:

```text
Task ID
Agent ID
Model
Tokens
Cost
Tool calls
Commands
Files read
Files modified
Execution time
Errors
Approvals
Final result
```

Provide:

```text
/trace
```

for the current task.

Example:

```text
Task Trace

Step 1  filesystem.search     182ms
Step 2  filesystem.read       21ms
Step 3  shell.execute         4.2s
Step 4  file.edit             14ms
Step 5  shell.execute         8.1s

Total:
12.5 seconds
23,481 tokens
```

---

# 30. Architecture

Use a modular architecture.

```text
forgecode/
│
├── apps/
│   └── cli/
│
├── packages/
│   ├── agent-runtime/
│   ├── ai-provider/
│   ├── tool-runtime/
│   ├── filesystem/
│   ├── shell/
│   ├── git/
│   ├── context-engine/
│   ├── permission-engine/
│   ├── task-engine/
│   ├── agent-manager/
│   ├── memory/
│   ├── mcp/
│   └── telemetry/
│
├── .forge/
│
├── tests/
│
└── docs/
```

Use clean boundaries.

Avoid creating one giant `agent.ts` file.

---

# 31. Recommended Stack

Use:

```text
TypeScript
Node.js
Ink
React
Zod
OpenAI SDK
execa
Tree-sitter
ripgrep
SQLite
Git
MCP
```

Optional:

```text
Docker
OpenTelemetry
SQLite FTS5
```

Use native Windows APIs where appropriate.

---

# 32. Configuration

Support:

```text
~/.forgecode/config.json
```

and project-level:

```text
.forge/config.json
```

Example:

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

Project configuration should override global configuration where appropriate.

---

# 33. CLI Commands

Implement:

```bash
forge
forge "fix my project"
forge --auto "implement authentication"
forge --readonly "analyze this repository"
forge --background
forge --model gpt-4.1-mini

forge task list
forge task create
forge task cancel

forge agent list
forge agent create
forge agent run

forge mcp list
forge mcp add

forge config
forge permissions
forge doctor
```

---

# 34. Doctor Command

Implement:

```bash
forge doctor
```

It should verify:

```text
✓ Node.js
✓ Git
✓ PowerShell
✓ OpenAI API configuration
✓ Filesystem permissions
✓ Project configuration
✓ MCP configuration
✓ SQLite
```

Example:

```text
ForgeCode Doctor

✓ Node.js v24.x
✓ pnpm
✓ Git
✓ PowerShell
✓ OpenAI API
✓ SQLite
✓ MCP runtime

ForgeCode is ready.
```

---

# 35. UX Requirements

The terminal UI must NOT be cluttered.

Avoid:

- excessive borders
- giant ASCII art
- unnecessary animations
- excessive colors
- constant model reasoning output
- dumping huge command output

Instead:

- clean hierarchy
- compact activity
- collapsible output
- clear status
- readable diffs
- keyboard-first navigation
- professional typography
- useful whitespace

The interface should feel like a serious developer tool.

---

# 36. No Fake Functionality

Do NOT create UI elements that don't actually work.

If the UI displays:

```text
File Editor
Task Manager
Custom Agents
MCP
Terminal
Memory
Permissions
Git
```

the backend must actually implement the corresponding functionality.

Do not use fake hardcoded responses.

Do not simulate command execution.

Do not simulate filesystem operations.

Do not create placeholder agent activity.

Everything shown in the UI must be connected to the real backend/tool runtime.

---

# 37. Production Requirements

Implement:

- Strong TypeScript types
- Zod validation
- Structured errors
- Timeouts
- Cancellation
- AbortController
- Tool execution isolation
- Permission checks
- Path validation
- Command validation
- Logging
- Persistent task state
- Graceful shutdown
- Recovery from model failures
- API retry/backoff
- Rate-limit handling
- Token tracking
- Streaming responses

Never expose:

```text
OPENAI_API_KEY
API credentials
private keys
passwords
tokens
```

to the terminal UI or logs.

---

# 38. Cancellation

The user must be able to stop the agent at any time.

Example:

```text
Ctrl+C
```

should safely cancel:

```text
LLM request
tool execution
shell process
agent loop
background operation
```

The application must clean up child processes.

---

# 39. Final Task Report

After completing a task:

```text
╭────────────────────────────────────────────╮
│ TASK COMPLETED                             │
├────────────────────────────────────────────┤
│                                            │
│ Fixed authentication failure               │
│                                            │
│ Files changed: 4                           │
│ Tests: 142 passed                           │
│ Build: Passed                               │
│                                            │
│ Changes:                                   │
│ • src/auth/session.ts                      │
│ • src/auth/middleware.ts                   │
│ • tests/auth.test.ts                       │
│ • tests/session.test.ts                    │
│                                            │
│ Duration: 34.8s                            │
│                                            │
╰────────────────────────────────────────────╯
```

Keep the final response concise.

---

# 40. Example End-to-End Workflow

User:

```text
> Find my Next.js project on C drive, run the tests,
> identify failures, fix them, and create a commit.
```

ForgeCode:

```text
1. Search C drive
2. Identify candidate repositories
3. Inspect package.json
4. Detect Next.js
5. Ask user which project if ambiguous
6. Inspect Git state
7. Create checkpoint/branch
8. Run tests
9. Analyze failures
10. Search relevant source files
11. Modify files
12. Run tests
13. Fix remaining failures
14. Run lint
15. Run production build
16. Review git diff
17. Show summary
18. Ask approval for commit
19. Create commit
20. Report completion
```

This workflow must be implemented for real.

---

# 41. Agent Roles

Initially provide:

```text
General Coding Agent
Code Reviewer
Debugging Agent
Test Fixer
Refactoring Agent
Security Auditor
DevOps Agent
Documentation Agent
Research Agent
File Organizer
```

Users can create unlimited custom agents.

---

# 42. File Organizer Agent Example

User:

```text
Create an agent that organizes my Downloads folder.
```

Agent configuration:

```text
Name:
Downloads Organizer

Mission:
Organize files based on type and date.

Allowed:
filesystem.list
filesystem.search
filesystem.metadata
filesystem.move
filesystem.createDirectory

Denied:
filesystem.delete

Approval:
Required for move operations
```

The agent should then autonomously perform the organization while respecting permissions.

---

# 43. Coding Agent Example

User:

```text
Create an agent called Next.js Engineer.
```

Configuration:

```text
Mission:
Build and maintain Next.js applications.

Tools:
filesystem
shell
git

Preferred:
TypeScript
Next.js
React
Tailwind
pnpm

Workflow:
Inspect → Plan → Implement → Test → Review
```

---

# 44. Multi-Agent System

Eventually support:

```text
                    Master Agent
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Research        Coding         Testing
          │              │              │
          └──────────────┼──────────────┘
                         │
                    Review Agent
                         │
                      Result
```

The master agent should delegate specialized tasks rather than attempting everything itself.

---

# 45. Custom Agent Builder

Provide an interactive builder:

```text
Create Agent

Name:
Description:
Mission:
Model:
Tools:
Permissions:
Instructions:
Memory:
Schedule:
Maximum Steps:
```

The generated agent configuration must be stored locally and immediately executable.

---

# 46. Local-First Design

The user's filesystem remains local.

Architecture:

```text
Windows Machine
│
├── ForgeCode CLI
├── Agent Runtime
├── Filesystem Tools
├── Shell Tools
├── Git
├── SQLite
└── MCP
        │
        ▼
     OpenAI API
```

Only information required for model reasoning should be sent to the AI provider.

Never upload the entire C drive.

Never index secrets unnecessarily.

Never send unrelated files to the model.

---

# 47. Important Windows Requirement

This application is primarily designed for Windows.

Use Windows-aware path handling:

```text
C:\Users\...
```

Do not assume:

```text
/
~/ 
/bin/bash
```

Use:

```text
PowerShell
CMD
Windows environment variables
Windows filesystem APIs
```

where appropriate.

Normalize paths internally but preserve Windows-native paths in the UI.

---

# 48. Implementation Priority

Build in this order.

## Phase 1

```text
CLI
OpenAI integration
Agent loop
Filesystem read/search
Shell execution
File editing
Permission system
```

## Phase 2

```text
Git
Task system
Persistent sessions
Context engine
Project instructions
Rollback
```

## Phase 3

```text
Custom agents
Agent builder
MCP
Background agents
Scheduled loops
Memory
```

## Phase 4

```text
Multi-agent orchestration
Browser automation
Docker sandbox
Advanced observability
Remote agents
```

---

# 49. Definition of Done

ForgeCode is considered functional only when the following real-world scenario works:

```text
1. User launches forge.

2. User enters a project directory.

3. User asks:
   "Analyze this project and fix the failing tests."

4. Agent scans the project.

5. Agent understands the architecture.

6. Agent runs the test suite.

7. Agent receives actual test failures.

8. Agent searches relevant files.

9. Agent edits the files using real patches.

10. Agent runs tests again.

11. Agent fixes remaining issues.

12. Agent runs build/lint.

13. Agent displays actual diff.

14. Agent asks for commit approval.

15. User approves.

16. Agent creates a real Git commit.

17. Agent reports the real result.

No simulated data is acceptable.

---

# 50. Final Product Vision

ForgeCode should ultimately feel like:

> **A software engineer living inside your terminal.**

The user should be able to say:

```text
"Build this."

"Fix this."

"Find this."

"Move these files."

"Analyze my computer."

"Create an agent."

"Monitor this project."

"Run this every hour."

"Review my code."

"Deploy this."

"Investigate this error."

```

And ForgeCode should understand the objective, plan the work, use the appropriate tools, execute actions, ask permission where necessary, recover from failures, verify its work, and report the outcome.

The key product principle is:

**Do not build an AI chatbot that can execute commands.**

Build an **autonomous agent runtime with a terminal interface**.

The terminal is only the interface.

The real product is the agent runtime, filesystem intelligence, tool system, permission engine, context engine, task engine, custom-agent system, and autonomous execution loop.