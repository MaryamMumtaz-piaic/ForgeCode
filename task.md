# ForgeCode CLI: Production-Grade AI Terminal & Agent Workspace Upgrade

You are working on **ForgeCode**, an AI-powered developer CLI.

The current application is functional, but its interface still looks like a basic terminal/chat interaction. I want you to redesign and upgrade ForgeCode into a **production-grade AI coding CLI experience**, inspired by the interaction quality of tools such as Claude Code, Codex CLI, Gemini CLI, OpenCode, and modern developer terminals, while keeping ForgeCode's own identity.

Do not create a fake visual-only terminal.

The goal is to improve both:

* the **CLI UI/UX**
* the **actual agent/tool execution architecture**

The final result should feel like a serious developer product that an experienced engineer could use every day.

---

# 1. Core Product Direction

ForgeCode should become:

> **An AI-native terminal workspace that can understand the user's machine, inspect projects, modify files, execute commands, and operate as an autonomous coding agent through a powerful CLI interface.**

The experience should combine:

* AI coding assistant
* terminal
* filesystem agent
* project explorer
* command palette
* tool execution viewer
* streaming AI chat
* code editing
* shell execution
* session history
* permissions/security
* agent status
* context awareness

Do NOT turn this into a generic dashboard.

The primary experience must remain a **developer CLI**.

---

# 2. Startup / CLI Branding Experience

When ForgeCode starts, do not immediately show a plain:

```text
ForgeCode > hi
```

Instead create a professional CLI startup experience.

Example concept:

```text
╭──────────────────────────────────────────────────────────────╮
│                                                              │
│   ███████╗ ██████╗ ██████╗  ██████╗ ███████╗                │
│   ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝                │
│   █████╗  ██║   ██║██████╔╝██║  ███╗█████╗                  │
│   ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝                  │
│   ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗                │
│   ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝                │
│                                                              │
│   AI Coding Agent                                            │
│                                                              │
╰──────────────────────────────────────────────────────────────╯

ForgeCode v1.x
Model: GPT-4.1-mini
Workspace: C:\Users\...
Status: Ready
```

The exact ASCII logo can be different, but it must look polished.

Show a compact startup status sequence:

```text
✓ Initializing ForgeCode
✓ Loading agent runtime
✓ Loading model provider
✓ Checking workspace
✓ Filesystem tools ready
✓ Terminal tools ready
✓ Session ready
```

Do not make startup unnecessarily slow.

The startup animation should be subtle and fast.

---

# 3. Main CLI Interface

After startup, create a proper persistent CLI workspace.

The layout should conceptually be:

```text
┌──────────────────────────────────────────────────────────────┐
│ ForgeCode                         GPT-4.1-mini   ● Ready     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent conversation / tool activity / command output          │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  > Ask ForgeCode anything...                                 │
│                                                              │
│  /commands   @files   !shell   ↑history                      │
└──────────────────────────────────────────────────────────────┘
```

The interface should support:

* scrolling conversation history
* streaming AI responses
* markdown
* syntax-highlighted code
* collapsible tool calls
* command output
* error output
* success states
* loading states
* cancellation
* retry
* copy buttons
* expandable details

---

# 4. Bottom Input Experience

The bottom input area is one of the most important parts of ForgeCode.

It should behave like a modern AI CLI.

Example:

```text
╭────────────────────────────────────────────────────────────╮
│ > Refactor the authentication system and run the tests      │
│                                                            │
│                                                            │
╰────────────────────────────────────────────────────────────╯

Enter to send
Shift+Enter for newline
↑↓ history
/ commands
@ files
! shell
```

The input should support multiline prompts.

It must remain visible while scrolling through previous responses.

---

# 5. Slash Command System

Typing `/` must immediately open an interactive command palette.

Example:

```text
> /

╭────────────────────────────────────────────────────────────╮
│ Commands                                                   │
│                                                            │
│ /help       Show ForgeCode commands                        │
│ /clear      Clear current conversation                     │
│ /reset      Reset agent session                            │
│ /model      Change AI model                                │
│ /status     Show system status                             │
│ /config     Open ForgeCode configuration                   │
│ /memory     Manage agent memory                            │
│ /files      Inspect filesystem                             │
│ /search     Search project                                 │
│ /run        Execute shell command                          │
│ /git        Git operations                                 │
│ /diff       Show current changes                           │
│ /undo       Undo latest agent change                       │
│ /permissions Manage tool permissions                       │
│ /exit       Exit ForgeCode                                 │
╰────────────────────────────────────────────────────────────╯
```

Requirements:

* fuzzy search
* keyboard navigation
* highlighted matching
* descriptions
* keyboard shortcuts
* command arguments
* autocomplete
* command history

Pressing Enter should execute the selected command.

---

# 6. @ File / Directory References

Implement an `@` reference system.

When the user types:

```text
> Fix @src/auth/login.ts
```

show an autocomplete menu:

```text
Files

src/
 ├── auth/
 │    ├── login.ts
 │    ├── register.ts
 │    └── middleware.ts
 ├── components/
 └── lib/
```

The user should be able to reference:

* files
* directories
* project folders
* configuration files
* Git files

Support fuzzy matching.

---

# 7. ! Shell Commands

Support explicit shell commands using:

```text
!npm install
!git status
!dir
!python script.py
```

Show execution clearly:

```text
$ npm test

⠋ Running command...

✓ Command completed
Exit code: 0

Tests: 42 passed
```

Never mix shell output with AI-generated text without visual distinction.

---

# 8. AI Tool Execution UI

When the agent performs an operation, show exactly what it is doing.

Example:

```text
● Agent working

┌─ filesystem.read
│  C:\Projects\ForgeCode\src\agent\runner.ts
│
│  Reading file...
└────────────────────────────────────

✓ 12.4 KB read
```

Then:

```text
┌─ filesystem.edit
│  C:\Projects\ForgeCode\src\agent\runner.ts
│
│  Applying patch...
└────────────────────────────────────

✓ File updated
```

Then:

```text
┌─ shell.execute
│  npm test
└────────────────────────────────────

✓ 42 tests passed
```

Tool calls must be collapsible.

The user should always know:

* what the agent is doing
* which file is affected
* which command is running
* whether it succeeded
* whether it failed
* how long it took

---

# 9. Full Windows Filesystem Access

This is extremely important.

The current implementation incorrectly behaves as though ForgeCode can only access a limited folder such as Downloads.

Do NOT hardcode Downloads-only behavior.

ForgeCode should have a proper filesystem abstraction capable of operating across the Windows filesystem.

The agent should be able to:

* list directories
* read files
* create files
* edit files
* delete files
* rename files
* move files
* copy files
* search files
* create directories
* inspect metadata
* calculate file size
* inspect timestamps
* detect file types
* recursively traverse directories
* search file contents
* generate diffs

Examples:

```text
C:\
C:\Users\
C:\Users\<user>\
C:\Users\<user>\Downloads\
C:\Users\<user>\Documents\
C:\Users\<user>\Desktop\
C:\Projects\
```

Do not assume that the workspace is always Downloads.

The agent should understand the current working directory and allow the user to explicitly select another workspace.

---

# 10. Windows Drive / Permission Architecture

Do NOT blindly give an AI agent unrestricted destructive access.

Implement a proper permission model.

Recommended levels:

```text
Filesystem Access

[1] Workspace Only
[2] User Directory
[3] Full C:\ Access
[4] Custom Allowed Paths
```

For example:

```text
Filesystem Permission

Workspace:
C:\Projects\ForgeCode

Access:
✓ Read
✓ Create
✓ Edit
✓ Rename
✓ Move
✓ Copy
✓ Search

Delete:
⚠ Confirmation required
```

For dangerous operations such as:

```text
delete
recursive delete
format
system modification
registry modification
credential access
protected OS directories
```

require explicit confirmation.

Do not silently bypass Windows permissions or UAC.

If Windows denies access, show the actual error and explain that the OS permission must be granted.

---

# 11. Workspace Management

Add a workspace concept.

Example:

```text
Current Workspace

C:\Projects\ForgeCode

[Change Workspace]
[Open Folder]
[Add Workspace]
```

Commands:

```text
/workspace
/workspace open
/workspace list
/workspace switch
```

The agent should prioritize the active workspace.

---

# 12. File Explorer Panel

Add an optional collapsible filesystem explorer.

Example:

```text
FILES

ForgeCode/
├── src/
│   ├── agent/
│   ├── cli/
│   ├── tools/
│   └── utils/
├── tests/
├── package.json
├── README.md
└── .env
```

Interactions:

* expand/collapse
* search
* open
* preview
* copy path
* rename
* delete
* create file
* create folder
* refresh

The explorer must not overpower the CLI.

It should remain secondary.

---

# 13. Agent Status

Create a small persistent status area.

Example:

```text
● READY
Model: GPT-4.1-mini
Workspace: ForgeCode
Tools: 12 enabled
Context: 10.4k
```

During execution:

```text
● WORKING
Reading project...
```

On errors:

```text
● ERROR
Tool execution failed
```

On waiting for permission:

```text
● WAITING
Permission required
```

---

# 14. Context Awareness

ForgeCode should understand:

* current directory
* active workspace
* Git repository
* Git branch
* changed files
* project type
* package manager
* available runtimes
* environment configuration
* relevant project files

Example:

```text
Workspace
C:\Projects\ForgeCode

Git
main
3 modified files

Runtime
Node 24.18.0
pnpm 10.x

Project
Next.js + TypeScript
```

Do not scan the entire C drive on every request.

Use lazy discovery, caching, indexing, and scoped search.

---

# 15. Agent File Operations

Create a unified tool API such as:

```text
filesystem.list
filesystem.read
filesystem.write
filesystem.edit
filesystem.delete
filesystem.move
filesystem.copy
filesystem.mkdir
filesystem.search
filesystem.stat
filesystem.diff
```

Every operation should return structured results.

Example:

```json
{
  "success": true,
  "operation": "read",
  "path": "C:\\Projects\\ForgeCode\\src\\agent.ts",
  "size": 12482
}
```

The UI should consume these structured tool events rather than parsing terminal strings.

---

# 16. Editing Experience

When ForgeCode modifies a file, do not simply say:

```text
File updated.
```

Show a compact diff.

Example:

```diff
src/auth.ts

- const token = localStorage.getItem("token");
+ const token = await secureStorage.get("token");

+ Added secure token handling
```

Provide:

```text
[Accept]
[Reject]
[Undo]
[View Full Diff]
```

For autonomous mode, allow configurable auto-approval.

---

# 17. Command Palette

Add a global command palette.

Keyboard shortcut:

```text
Ctrl + K
```

Example:

```text
╭────────────────────────────────────────────────────────────╮
│ Search commands, files, tools...                            │
├────────────────────────────────────────────────────────────┤
│ > filesystem.search                                        │
│   shell.execute                                            │
│   git.status                                               │
│   workspace.switch                                         │
│   model.change                                             │
│   permissions.configure                                    │
╰────────────────────────────────────────────────────────────╯
```

---

# 18. Help System

`/help` should not return an ugly wall of text.

Create a structured interactive help UI.

Example:

```text
ForgeCode Commands

Navigation
  /help
  /clear
  /history

Agent
  /model
  /status
  /memory

Filesystem
  /files
  /search
  /workspace

Developer
  /run
  /git
  /diff
```

---

# 19. Sessions

Support persistent sessions.

Example:

```text
Sessions

● authentication-refactor
  24 Aug, 09:32
  18 messages

○ ecommerce-dashboard
  23 Aug, 18:10
  42 messages

○ agentcanvas
  21 Aug, 14:20
  31 messages
```

Commands:

```text
/session
/session new
/session list
/session switch
/session rename
```

---

# 20. Tool Registry

ForgeCode should have a proper internal tool registry.

Each tool should expose:

```text
name
description
schema
permission level
execute()
```

Example tools:

```text
filesystem
shell
git
search
browser
process
workspace
memory
```

This architecture should make it easy to add future tools without rewriting the CLI.

---

# 21. MCP-Style Extensibility

Design the tool layer so external tools can eventually be registered.

For example:

```text
ForgeCode Tools

✓ filesystem
✓ shell
✓ git
✓ search
✓ browser

+ Add Tool
```

Future integrations should be possible without changing the core agent runtime.

---

# 22. Security Model

Security is critical.

Do NOT implement:

```text
AI can execute absolutely anything without permission
```

Instead implement permission scopes.

Example:

```text
Permission Request

ForgeCode wants to execute:

rm -rf ./build

Scope:
Workspace

Risk:
HIGH

[Allow Once]
[Allow This Session]
[Deny]
```

For Windows commands use Windows-native behavior.

Dangerous operations should require explicit confirmation.

Never expose secrets from:

```text
.env
credentials
SSH keys
browser profiles
password stores
system credential directories
```

unless the user explicitly requests access and the permission model allows it.

---

# 23. Error Handling

Errors should be useful.

Bad:

```text
Error reading folder.
```

Good:

```text
✕ filesystem.list failed

Path:
C:\Users\...\Downloads

Reason:
Access denied

Windows error:
EACCES

Suggestion:
Choose another workspace or grant the required Windows permission.

[Retry]
[Change Workspace]
```

Never fabricate capabilities.

If the OS blocks access, report the real failure.

---

# 24. Streaming Responses

AI responses should stream naturally.

Example:

```text
● ForgeCode

I found the issue in the authentication middleware.

The middleware is reading the token before the session
has been initialized...

[streaming]
```

Tool activity should appear while the response is being generated.

Do not freeze the entire UI while an agent operation is running.

---

# 25. Keyboard-First UX

Support:

```text
Enter       Send
Shift+Enter New line
↑ / ↓       History
Tab         Autocomplete
Esc         Cancel / close popup
Ctrl+K      Command palette
Ctrl+C      Cancel running operation
Ctrl+L      Clear terminal view
Ctrl+R      Reload workspace
```

The CLI should feel fast without requiring mouse interaction.

---

# 26. Visual Design

The current UI is too close to a raw terminal.

Upgrade it into a premium developer tool.

Design language:

* dark-first
* extremely clean
* minimal
* high information density
* subtle borders
* excellent typography
* restrained accent color
* smooth micro-interactions
* no unnecessary gradients
* no excessive glassmorphism
* no giant cards
* no decorative marketing UI

Think:

```text
Claude Code
+
Codex CLI
+
modern terminal
+
VS Code command palette
```

But do not copy any product's UI exactly.

ForgeCode must have its own visual identity.

---

# 27. Terminal Output

Terminal output should support:

* ANSI colors
* command grouping
* timestamps
* exit codes
* collapsible long output
* copy output
* clear output
* search output

Example:

```text
$ pnpm build

▲ Next.js 15

✓ Compiled successfully
✓ Type checking
✓ Build completed

Exit code: 0
Duration: 18.4s
```

---

# 28. Agent Activity Timeline

Add a subtle activity timeline.

Example:

```text
09:41:02  User request
09:41:03  Agent planning
09:41:04  filesystem.search
09:41:05  filesystem.read
09:41:07  filesystem.edit
09:41:08  shell.execute
09:41:26  Completed
```

This becomes extremely useful for debugging autonomous agents.

---

# 29. Cancellation

A running agent must always be cancellable.

Show:

```text
● Agent working...

Reading 142 files...

[Cancel]
```

Pressing:

```text
Esc
```

or:

```text
Ctrl+C
```

should cancel the current operation safely.

Do not leave zombie shell processes.

---

# 30. Performance Requirements

Do not scan the entire C:\ drive on startup.

Use:

* lazy loading
* filesystem watchers
* caching
* indexed search
* scoped discovery
* async operations
* streaming
* debounced autocomplete
* virtualized large directory lists

Large folders should remain responsive.

---

# 31. Architecture

Keep the application modular.

Recommended architecture:

```text
ForgeCode
│
├── CLI UI
│   ├── Input
│   ├── Command Palette
│   ├── Chat Renderer
│   ├── Tool Renderer
│   ├── File Explorer
│   └── Status Bar
│
├── Agent Runtime
│   ├── Planner
│   ├── Model Provider
│   ├── Context Manager
│   ├── Session Manager
│   └── Permission Manager
│
├── Tool Runtime
│   ├── Filesystem
│   ├── Shell
│   ├── Git
│   ├── Search
│   ├── Workspace
│   └── Process
│
├── Storage
│   ├── Sessions
│   ├── Config
│   ├── Permissions
│   └── Cache
│
└── Platform
    └── Windows
```

Keep the UI independent from the tool implementations.

---

# 32. Important Behavioral Requirement

If the user says:

```text
Read my Downloads folder.
```

ForgeCode should actually attempt:

```text
C:\Users\<username>\Downloads
```

using the filesystem tool.

If the user says:

```text
Read my C drive.
```

ForgeCode should understand that this means:

```text
C:\
```

and operate according to the configured permission scope.

If permission is unavailable, show the real permission error.

Do not respond with:

```text
I don't have access to your local machine.
```

when ForgeCode is actually running locally and its filesystem tool has been configured.

---

# 33. Do Not Fake Tool Execution

This is extremely important.

The UI must not display fake:

```text
✓ File created
✓ File edited
✓ Command executed
```

unless the underlying operation actually succeeded.

Every UI state must originate from the real tool runtime.

Implement a structured event system:

```text
agent.started
agent.thinking
tool.started
tool.progress
tool.completed
tool.failed
permission.requested
agent.completed
agent.cancelled
```

The UI renders these events.

---

# 34. Final UX Goal

After the upgrade, a user should be able to open ForgeCode and experience:

```text
ForgeCode
AI Coding Agent

● Ready
Workspace: C:\Projects\ForgeCode

> Analyze this project and find why the build is failing.
```

ForgeCode should then:

```text
● Planning

→ Detecting project
✓ Next.js + TypeScript

→ Checking Git
✓ branch: main

→ Searching source
✓ 34 relevant files

→ Reading files
✓ 8 files

→ Running tests
$ pnpm test

✓ 42 tests passed

→ Fixing issue
✓ src/lib/config.ts

→ Verifying
✓ Build successful
```

Then provide a concise final answer:

```text
Done.

Fixed the environment configuration issue in:

src/lib/config.ts

Tests:
42 passed

Build:
✓ Successful

Files changed:
1

[View Diff]
```

---

# 35. Implementation Instructions

Before changing the code:

1. Inspect the entire existing ForgeCode codebase.
2. Understand the current CLI architecture.
3. Identify the current model provider implementation.
4. Identify the current filesystem implementation.
5. Identify how commands are parsed.
6. Identify how tool execution works.
7. Identify the current session/state architecture.
8. Identify existing UI components that can be reused.
9. Do not unnecessarily rewrite working infrastructure.
10. Preserve existing functionality while upgrading the architecture.

Then implement the upgrade incrementally.

Do not just create a visual mockup.

The final implementation must have real:

* CLI interactions
* slash commands
* autocomplete
* file references
* filesystem operations
* shell execution
* tool events
* permissions
* workspace management
* sessions
* streaming responses
* cancellation
* errors
* diffs

---

# 36. Acceptance Criteria

The implementation is complete only when:

* [ ] ForgeCode has a professional CLI startup experience.
* [ ] Main UI no longer looks like a basic raw terminal.
* [ ] Persistent AI input exists.
* [ ] `/` command autocomplete works.
* [ ] `@` file references work.
* [ ] `!` shell commands work.
* [ ] Command palette works.
* [ ] Workspace switching works.
* [ ] File explorer works.
* [ ] Real filesystem operations work.
* [ ] C:\ access follows explicit permission scope.
* [ ] File editing produces real diffs.
* [ ] Shell commands execute for real.
* [ ] Tool execution is visible.
* [ ] Tool execution is collapsible.
* [ ] Streaming responses work.
* [ ] Agent cancellation works.
* [ ] Sessions persist.
* [ ] Errors are displayed clearly.
* [ ] Permissions are enforced.
* [ ] No fake tool results exist.
* [ ] Large directories remain performant.
* [ ] The application remains keyboard-first.
* [ ] Existing ForgeCode functionality continues working.

---

# Final Instruction

Treat this as a **real product upgrade**, not a frontend redesign.

First inspect the existing implementation and architecture.

Then identify the minimum architectural changes required.

Then implement the UI and runtime improvements.

Do not replace working functionality just to make the interface look different.

Prioritize:

**real functionality → architecture → CLI UX → visual polish → performance → security.**

The final ForgeCode experience should feel like a serious, production-ready **AI-native developer terminal**, not a chatbot placed inside a terminal window.