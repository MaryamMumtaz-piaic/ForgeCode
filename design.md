# ForgeCode — Design Document

## Design Philosophy

ForgeCode must feel like a **serious professional developer tool**, not a toy chatbot or a demo project.

The terminal is the primary interface. Every design decision — layout, colors, spacing, typography, information density — must serve the developer who uses this tool for real work all day.

Three rules that govern every design choice:

1. **No fake elements.** Nothing in the UI that is not connected to the real backend.
2. **No clutter.** Dense information without visual noise. Every pixel must earn its place.
3. **Keyboard-first.** Mouse is optional. Every feature reachable from the keyboard.

---

## Terminal UI Framework

| Layer | Technology |
|---|---|
| UI framework | Ink (React for terminals) |
| Language | TypeScript |
| Rendering | Full-screen terminal via `ink` |
| Styling | `chalk` for color, `ink` Box/Text components for layout |
| Icons | Unicode symbols — no external icon fonts |

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                  │
│  Logo · Model · Status · CWD                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CONVERSATION / OUTPUT AREA                                  │
│  (scrollable)                                                │
│                                                              │
│  ⚡ AGENT ACTIVITY PANEL                                     │
│  (collapsible tool calls + state)                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  STATUS BAR                                                  │
│  Tokens · Cost · Duration · Steps                            │
├──────────────────────────────────────────────────────────────┤
│  INPUT BAR                                                   │
│  > _                                                         │
└──────────────────────────────────────────────────────────────┘
```

### Header Bar

```
FORGECODE                      GPT-4.1-mini   ● READY
```

- Left: product name (bold, fixed)
- Center: current model name
- Right: agent status indicator (colored dot + label)

### Conversation Area

- Scrollable message history
- User messages displayed with `>` prefix
- Agent responses displayed below, streamed in real time
- Tool activity shown inline as it executes

### Agent Activity Panel

```
⚡ Agent Activity

├─ filesystem.search       182ms  ✓
├─ filesystem.read          21ms  ✓
├─ shell.execute              4.2s  ✓
├─ file.edit                14ms  ✓
└─ shell.execute              8.1s  ✓
```

- Collapsed by default — expands when tools execute
- Each line shows: tool name, duration, result icon
- Pressing `[space]` on a tool line expands its output
- Long outputs are truncated with `[+N lines]` expander

### Status Bar

```
~/Projects/my-app   │   23,481 tokens   │   $0.012   │   34.8s   │   Step 7/50
```

### Input Bar

```
> _
```

- Supports command autocomplete (`/help`, `/tasks`, etc.)
- Arrow-key history navigation
- `Tab` for command completion
- `Ctrl+C` cancels current agent execution

---

## Color Palette

ForgeCode uses a minimal, purposeful color set. Every color carries semantic meaning — never used decoratively.

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Cyan | `#00BCD4` | FORGECODE brand, active highlights |
| Success | Green | `#4CAF50` | Completed steps, test passes, ✓ |
| Warning | Yellow | `#FFC107` | Approval prompts, caution states |
| Error | Red | `#F44336` | Failures, errors, rejections |
| Muted | Gray | `#616161` | Secondary text, timestamps, metadata |
| Accent | White | `#FFFFFF` | Primary text, input |
| Background | Terminal default | — | Never override the terminal background |

Color is never used just for decoration. A green line means something succeeded. A yellow line means something needs your attention. A red line means something failed.

---

## Typography Rules

- **No ASCII art** in the main UI — used only in deliberate structural borders.
- **No giant banners** on startup — one clean header line is enough.
- **Monospace** everywhere (terminal default font).
- **Bold** for section headers and important labels only.
- **Dim** for secondary information (timestamps, metadata, paths).
- **Normal weight** for primary content and agent output.

---

## Agent State Indicators

Each agent state has a specific visual treatment:

| State | Indicator | Color |
|---|---|---|
| `IDLE` | `●` | Gray |
| `THINKING` | `◌` (pulsing) | Cyan |
| `PLANNING` | `◎` | Cyan |
| `SEARCHING` | `⊙` | Cyan |
| `READING` | `▶` | Cyan |
| `EDITING` | `✎` | Yellow |
| `EXECUTING` | `⚙` (spinning) | Yellow |
| `WAITING_FOR_APPROVAL` | `⚠` (blinking) | Yellow |
| `VERIFYING` | `◐` | Cyan |
| `COMPLETED` | `✓` | Green |
| `FAILED` | `✗` | Red |
| `CANCELLED` | `⊘` | Gray |

Status indicators update in real time. The header always shows the current state.

---

## Progress & Spinner

- Use a minimal spinner character set: `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏`
- Spinners only appear during active async work
- They disappear the moment the operation completes
- No decorative or permanent animations

---

## Approval Prompt Design

Approval prompts interrupt the agent loop and require keyboard input. They must be impossible to miss, but must not be alarming for routine operations.

```
┌───────────────────────────────────────────────┐
│             ACTION REQUIRES APPROVAL          │
├───────────────────────────────────────────────┤
│                                               │
│ Tool:    filesystem.move                      │
│ Risk:    MEDIUM                               │
│                                               │
│ Source:                                       │
│   C:\Downloads\project.zip                    │
│                                               │
│ Destination:                                  │
│   C:\Projects\project.zip                     │
│                                               │
│ [Y] Allow once   [A] Always allow             │
│ [N] Deny         [C] Cancel task              │
│                                               │
└───────────────────────────────────────────────┘
```

High-risk operations use red border and `CAUTION` label:

```
┌───────────────────────────────────────────────┐
│           ⚠  CAUTION — HIGH RISK              │
├───────────────────────────────────────────────┤
│                                               │
│ Tool:    filesystem.delete                    │
│ Risk:    HIGH — Permanent deletion            │
│                                               │
│ Target:                                       │
│   C:\Projects\old-app  (1.2 GB, 847 files)   │
│                                               │
│ [Y] Allow once                                │
│ [N] Deny (recommended)                        │
│ [C] Cancel task                               │
│                                               │
└───────────────────────────────────────────────┘
```

- `[A] Always allow` is hidden for HIGH_RISK operations.
- The recommended choice is always explicitly labeled.
- The prompt blocks all other input while active.

---

## File Diff Display

When the agent edits a file, always show a diff before applying:

```
FILE EDIT

src/auth/session.ts

  1   const session = createSession()
- 2   const token = getToken()
- 3   return token
+ 2   const token = await getToken()
+ 3   if (!token) {
+ 4     throw new AuthError('Token missing')
+ 5   }
+ 6   return token
  7
```

- Red (`-`) lines = removed
- Green (`+`) lines = added
- Gray lines = unchanged context
- File path shown above the diff
- Line numbers shown on the left

---

## Task Progress Display

```
TASK #42 — Fix authentication system

Status: IN PROGRESS

  ✓  Inspect repository
  ✓  Locate authentication module
  ✓  Reproduce bug
  ✓  Identify root cause
  ●  Implement fix          ← current step
  ○  Run tests
  ○  Review diff
  ○  Complete
```

- `✓` = completed (green)
- `●` = active (cyan + pulsing)
- `○` = pending (gray)
- `✗` = failed (red)

---

## Task Completion Report

```
╭────────────────────────────────────────────╮
│ TASK COMPLETED                             │
├────────────────────────────────────────────┤
│                                            │
│ Fixed authentication failure               │
│                                            │
│ Files changed:    4                        │
│ Tests:            142 passed               │
│ Build:            Passed                   │
│                                            │
│ Changes:                                   │
│  • src/auth/session.ts                     │
│  • src/auth/middleware.ts                  │
│  • tests/auth.test.ts                      │
│  • tests/session.test.ts                   │
│                                            │
│ Duration:  34.8s  │  Tokens: 23,481        │
│                                            │
╰────────────────────────────────────────────╯
```

- Box uses `╭╮╰╯` corners for a softer look than `┌┐└┘`.
- Green header for success, red for failure.
- Always shows: what changed, test result, build result, duration, tokens.
- Keep it concise — no verbose narration.

---

## Execution Trace Display (`/trace`)

```
Task Trace — #42

 Step 1  filesystem.search      182ms   ✓
 Step 2  filesystem.read         21ms   ✓
 Step 3  shell.execute            4.2s  ✓
 Step 4  file.edit               14ms   ✓
 Step 5  shell.execute            8.1s  ✓
 Step 6  shell.execute            1.3s  ✓

 Total:  14.0s   │   23,481 tokens   │   $0.012
```

---

## Doctor Output Design (`forge doctor`)

```
ForgeCode Doctor

  ✓  Node.js v24.1.0
  ✓  pnpm 9.4.0
  ✓  Git 2.45.0
  ✓  PowerShell 7.4
  ✓  OpenAI API key configured
  ✓  SQLite available
  ✓  MCP runtime available
  ✗  ripgrep not found — install with: winget install BurntSushi.ripgrep

ForgeCode is partially ready. Fix 1 issue above.
```

---

## Error Display

```
ERROR

shell.execute failed

Command:   pnpm test
Exit code: 1

Output:
  Error: Cannot find module './auth'
  at Object.<anonymous> (src/app.ts:4:1)

Agent is analyzing the failure...
```

- Always show: what failed, what command, what error.
- Never dump raw stack traces without context.
- Immediately follow with what the agent is doing to recover.

---

## Startup Screen

No splash screen. No ASCII art logo. No delay.

On launch:

```
FORGECODE   GPT-4.1-mini   ● IDLE

~/Projects/my-app

Project detected:
  Framework:  Next.js 14
  Language:   TypeScript
  Package:    pnpm
  Tests:      Vitest
  Git:        ✓  (3 uncommitted changes)

> _
```

Fast, informative, ready.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Submit input |
| `↑` / `↓` | Navigate command history |
| `Tab` | Autocomplete command |
| `Ctrl+C` | Cancel current agent execution |
| `Ctrl+L` | Clear output |
| `Ctrl+Z` | Undo last action |
| `Esc` | Cancel current input |
| `Space` | Expand/collapse tool output |
| `Y` / `N` / `A` / `C` | Answer approval prompt |

---

## Anti-Patterns (Explicitly Forbidden)

These must never appear in the ForgeCode UI:

| Forbidden | Reason |
|---|---|
| Fake tool activity (hardcoded placeholders) | Destroys trust immediately |
| Giant ASCII art banner | Wastes space, looks amateurish |
| Simulated command output | Worse than no output |
| Constant model reasoning dump | Noise, not signal |
| Dumping hundreds of lines of stdout | Use collapsible + truncation |
| Excessive border boxes everywhere | Visual clutter |
| More than 3-4 colors in active use | Loses semantic meaning |
| Decorative animations | Distracting |
| Chatbot-style "How can I help you today?" | Wrong product identity |

---

## Design Checklist

Before shipping any UI component:

- [ ] Is every element connected to real backend data?
- [ ] Does it work at a standard 80-column terminal width?
- [ ] Does it work at 120 columns (common for developers)?
- [ ] Is it readable without color (color-blind / monochrome support)?
- [ ] Can every action be triggered from the keyboard?
- [ ] Is streaming output handled without flickering?
- [ ] Does `Ctrl+C` cleanly cancel without leaving orphan processes?
- [ ] Are errors shown with enough context to understand what failed?
- [ ] Are approval prompts impossible to accidentally skip?
- [ ] Is the agent's current state always visible in the header?
