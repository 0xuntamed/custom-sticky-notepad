# HoverNotes — Architecture & Requirements

## 1. Overview

**HoverNotes** is a lightweight desktop sticky-notes application that allows users to create small notes that can remain visible **above any active application window**.

The core idea is simple:

> Notes should behave like floating desktop overlays rather than normal application windows.

A user should be able to keep a note visible while working in VS Code, Chrome, Terminal, Figma, PowerPoint, or any other desktop application.

The application should prioritize:

- fast note creation
- minimal UI
- low memory usage
- always-on-top behavior
- local-first storage
- keyboard-driven interaction
- optional transparent / click-through overlays

---

# 2. Product Goals

## Primary Goal

Allow users to create persistent floating notes that stay visible regardless of which desktop application currently has focus.

Example:

```text
┌───────────────────────────────────────────────────────┐
│ VS CODE                                               │
│                                                       │
│  function createPayment() {                           │
│                                                       │
│          ┌───────────────────────────┐                 │
│          │ Payment TODO             │                 │
│          │                           │                 │
│          │ - Add idempotency        │                 │
│          │ - Add retry handling     │                 │
│          │ - Handle timeout         │                 │
│          └───────────────────────────┘                 │
│                                                       │
│      await payment.process()                          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

The sticky note remains above VS Code even when VS Code is the active application.

---

# 3. Non-Goals for MVP

The first version should **not** attempt to become a full productivity platform.

Avoid initially implementing:

- cloud sync
- collaborative editing
- accounts / authentication
- AI features
- rich document editing
- complex Markdown rendering
- team workspaces
- mobile apps
- browser extensions

These can be added later.

The MVP should focus on getting native desktop window behavior right.

---

# 4. Recommended Technology Stack

## Desktop Framework

**Tauri**

Reasons:

- lightweight compared with Electron
- native desktop window APIs
- very small packaged application
- Rust backend provides access to OS-level APIs
- supports Windows, macOS, and Linux
- integrates easily with React

---

## Frontend

```text
React
TypeScript
Vite
```

React handles:

- note editor UI
- toolbar
- note settings
- note state
- keyboard interactions

---

## Native Layer

```text
Tauri
Rust
```

The native layer handles:

- window creation
- always-on-top behavior
- transparency
- click-through
- global keyboard shortcuts
- tray menu
- window positioning
- application lifecycle

---

## Local Persistence

For MVP:

```text
JSON file
```

or

```text
Tauri Store Plugin
```

Later versions can migrate to:

```text
SQLite
```

SQLite becomes useful when supporting:

- thousands of notes
- search
- tags
- note history
- archived notes
- application-specific notes

---

# 5. High-Level Architecture

```text
                  ┌──────────────────────────────┐
                  │          HoverNotes          │
                  └──────────────┬───────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       React UI          │
                    │                         │
                    │ Note Editor             │
                    │ Toolbar                 │
                    │ Settings                │
                    │ Notes Manager           │
                    └────────────┬────────────┘
                                 │
                        Tauri IPC Commands
                                 │
                    ┌────────────▼────────────┐
                    │      Native Layer       │
                    │        (Rust)           │
                    │                         │
                    │ Window Manager          │
                    │ Global Shortcuts        │
                    │ Window Events           │
                    │ OS Integration          │
                    │ System Tray             │
                    └───────┬─────────┬───────┘
                            │         │
                    ┌───────▼───┐ ┌──▼──────────┐
                    │ OS Window │ │ Persistence │
                    │ Manager   │ │ Layer       │
                    └───────────┘ └─────────────┘
```

---

# 6. Runtime Architecture

Each sticky note should ideally be represented as an **independent native window**.

Example:

```text
HoverNotes Process

├── Main Controller Window
│
├── Note Window #1
│   └── React Note UI
│
├── Note Window #2
│   └── React Note UI
│
├── Note Window #3
│   └── React Note UI
│
└── System Tray
```

This allows every note to:

- have its own position
- have its own dimensions
- independently remain on top
- independently control opacity
- independently enable click-through mode
- be moved across monitors

---

# 7. Core Data Model

```ts
export interface Note {
  id: string;

  title?: string;
  content: string;

  position: {
    x: number;
    y: number;
  };

  size: {
    width: number;
    height: number;
  };

  appearance: {
    opacity: number;
    theme: NoteTheme;
  };

  behavior: {
    alwaysOnTop: boolean;
    clickThrough: boolean;
    locked: boolean;
  };

  createdAt: number;
  updatedAt: number;
}

export type NoteTheme =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "dark";
```

---

# 8. Functional Requirements

## FR-001 — Create Note

Users must be able to create a new sticky note.

Default note size:

```text
width: 320px
height: 280px
```

Default behavior:

```text
alwaysOnTop = true
opacity = 1
clickThrough = false
```

---

## FR-002 — Always On Top

A note must remain visible above other application windows.

Example:

```text
Chrome active
     ↓

┌────────────────────────────────┐
│ Chrome                         │
│                                │
│      ┌─────────────────┐       │
│      │ Sticky Note     │       │
│      │                 │       │
│      │ API endpoint    │       │
│      │ /users/:id      │       │
│      └─────────────────┘       │
│                                │
└────────────────────────────────┘
```

The note should remain visible even when Chrome receives keyboard focus.

---

## FR-003 — Move Note

Users must be able to drag a note anywhere on the screen.

Preferred interaction:

```text
drag title bar
```

or:

```text
Alt + drag anywhere
```

---

## FR-004 — Resize Note

Notes must support manual resizing.

Minimum size:

```text
200 × 120 px
```

Recommended maximum:

```text
No artificial limit
```

The operating system's desktop bounds should be respected.

---

## FR-005 — Edit Note

Users must be able to type directly inside a note.

The editor should support plain text in MVP.

Required keyboard behavior:

```text
Enter       -> newline
Ctrl/Cmd+A  -> select all
Ctrl/Cmd+C  -> copy
Ctrl/Cmd+V  -> paste
Ctrl/Cmd+Z  -> undo
Ctrl/Cmd+Y  -> redo
```

---

## FR-006 — Auto Save

Notes must automatically persist after edits.

Recommended strategy:

```text
user types
   ↓
debounce 300-500ms
   ↓
update note store
   ↓
persist locally
```

No explicit Save button should be required.

---

## FR-007 — Delete Note

Users must be able to delete a note.

The system should optionally support a small Undo window later.

MVP may perform immediate deletion.

---

## FR-008 — Pin / Unpin

Each note should expose a Pin action.

Pinned:

```text
alwaysOnTop = true
```

Unpinned:

```text
alwaysOnTop = false
```

---

## FR-009 — Opacity

Users should be able to control note transparency.

Allowed range:

```text
40% - 100%
```

Example:

```text
100% ━━━━━━━━━━━━━━━━━━━━━
 80% ━━━━━━━━━━━━━━━━
 60% ━━━━━━━━━━━
 40% ━━━━━━━
```

Avoid extremely low opacity because the note can become difficult to locate.

---

## FR-010 — Click-Through Mode

A note should optionally become visible while ignoring pointer input.

Example:

```text
Mouse click
    │
    ▼
┌───────────────┐
│ Sticky Note   │  <-- visible
└───────────────┘
    │
    │ click passes through
    ▼
┌───────────────┐
│ VS Code       │
└───────────────┘
```

This mode is useful when a note is only being used as reference material.

A global shortcut MUST exist to disable click-through mode so users cannot accidentally make a note impossible to interact with.

---

## FR-011 — Lock Note

Users should be able to lock a note's position.

Locked notes:

- cannot be dragged accidentally
- cannot be resized accidentally
- can still be edited unless click-through is enabled

---

## FR-012 — Global Shortcut: New Note

Recommended shortcut:

```text
Ctrl + Shift + N
```

On macOS:

```text
Cmd + Shift + N
```

Behavior:

```text
shortcut pressed
      ↓
create note
      ↓
place near center of active monitor
      ↓
focus editor
```

---

## FR-013 — Global Shortcut: Show / Hide Notes

Recommended shortcut:

```text
Ctrl + Shift + H
```

Behavior:

```text
Visible notes
     ↓
shortcut
     ↓
all notes hidden
     ↓
shortcut again
     ↓
all notes restored
```

---

## FR-014 — Restore Notes on Startup

When HoverNotes starts, previously open notes should be restored.

Restore:

- note content
- x/y position
- width/height
- opacity
- theme
- pin state
- lock state

---

## FR-015 — Multi-Monitor Support

Notes should support multiple monitors.

A note can exist on:

```text
Monitor 1
Monitor 2
Monitor 3
```

When a monitor is disconnected, notes located outside available screen bounds must be moved onto an available monitor.

---

# 9. Native Window Requirements

Each note window should use approximately the following configuration:

```ts
const noteWindow = new WebviewWindow(`note-${note.id}`, {
  width: note.size.width,
  height: note.size.height,

  x: note.position.x,
  y: note.position.y,

  decorations: false,
  transparent: true,
  resizable: true,
  alwaysOnTop: note.behavior.alwaysOnTop,

  skipTaskbar: true
});
```

Exact Tauri APIs may vary by version and platform.

Native behavior must be isolated behind a window service rather than being scattered across React components.

---

# 10. Window Service

Recommended abstraction:

```ts
interface WindowService {
  createNoteWindow(note: Note): Promise<void>;

  closeNoteWindow(id: string): Promise<void>;

  setAlwaysOnTop(
    id: string,
    enabled: boolean
  ): Promise<void>;

  setClickThrough(
    id: string,
    enabled: boolean
  ): Promise<void>;

  setOpacity(
    id: string,
    opacity: number
  ): Promise<void>;

  getPosition(
    id: string
  ): Promise<{ x: number; y: number }>;

  getSize(
    id: string
  ): Promise<{ width: number; height: number }>;
}
```

This separates:

```text
React UI concerns
        from
OS window-management concerns
```

---

# 11. Suggested Project Structure

```text
hover-notes/
│
├── src/
│   │
│   ├── components/
│   │   ├── note/
│   │   │   ├── Note.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NoteToolbar.tsx
│   │   │   └── OpacitySlider.tsx
│   │   │
│   │   └── common/
│   │       ├── IconButton.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── hooks/
│   │   ├── useNote.ts
│   │   ├── useAutoSave.ts
│   │   └── useWindowState.ts
│   │
│   ├── services/
│   │   ├── note.service.ts
│   │   ├── storage.service.ts
│   │   └── window.service.ts
│   │
│   ├── store/
│   │   └── notes.store.ts
│   │
│   ├── types/
│   │   └── note.ts
│   │
│   ├── utils/
│   │   ├── debounce.ts
│   │   └── monitor.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/
│   │
│   ├── src/
│   │   ├── lib.rs
│   │   ├── main.rs
│   │   │
│   │   ├── commands/
│   │   │   ├── window.rs
│   │   │   ├── notes.rs
│   │   │   └── shortcuts.rs
│   │   │
│   │   ├── windows/
│   │   │   └── manager.rs
│   │   │
│   │   ├── storage/
│   │   │   └── notes.rs
│   │   │
│   │   └── tray/
│   │       └── menu.rs
│   │
│   ├── capabilities/
│   │   └── default.json
│   │
│   └── tauri.conf.json
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 12. State Flow

When a user edits a note:

```text
User types
    │
    ▼
NoteEditor
    │
    ▼
React Store
    │
    ▼
Debounced Save
    │
    ▼
Storage Service
    │
    ▼
Local Persistent Storage
```

Window movement follows another path:

```text
User drags window
      │
      ▼
Native OS Window
      │
      ▼
Tauri move event
      │
      ▼
Window Service
      │
      ▼
Update note coordinates
      │
      ▼
Persistent Storage
```

---

# 13. Persistence Format

Example MVP data:

```json
{
  "version": 1,
  "notes": [
    {
      "id": "note_01",
      "title": "Redis bug",
      "content": "Check cache miss handling",
      "position": {
        "x": 910,
        "y": 180
      },
      "size": {
        "width": 320,
        "height": 260
      },
      "appearance": {
        "opacity": 0.9,
        "theme": "yellow"
      },
      "behavior": {
        "alwaysOnTop": true,
        "clickThrough": false,
        "locked": false
      },
      "createdAt": 1787020000000,
      "updatedAt": 1787021000000
    }
  ]
}
```

---

# 14. UI Design

The interface should intentionally remain minimal.

```text
┌──────────────────────────────────────┐
│ ⠿  Redis Bug             ◉  📌  ⋯  × │
├──────────────────────────────────────┤
│                                      │
│ Cache shouldn't hit DB every time.  │
│                                      │
│ Check:                               │
│                                      │
│ - TTL                                │
│ - cache key                          │
│ - serialization                     │
│                                      │
└──────────────────────────────────────┘
```

Toolbar controls:

```text
Drag Handle
Pin
Opacity
Lock
More
Close
```

The toolbar can become partially hidden when the mouse leaves the note.

---

# 15. System Tray

HoverNotes should run from the system tray.

Suggested menu:

```text
HoverNotes
──────────────
New Note
Show All Notes
Hide All Notes
──────────────
Settings
──────────────
Quit
```

Closing individual notes should NOT terminate the application.

---

# 16. Application Lifecycle

```text
OS starts
    │
    ▼
HoverNotes launches
    │
    ▼
Load notes from disk
    │
    ▼
Validate monitor positions
    │
    ▼
Create native note windows
    │
    ▼
Register global shortcuts
    │
    ▼
Create tray icon
    │
    ▼
Application ready
```

---

# 17. Error Handling

The application must handle:

### Invalid stored note data

Fallback to defaults.

### Monitor disconnected

Move inaccessible notes onto the primary monitor.

### Corrupted persistence file

Create a backup if possible and initialize clean storage.

### Failed shortcut registration

Show a warning and allow users to configure another shortcut.

### Failed native-window operation

Log the native error without crashing all notes.

One broken note window must not terminate the entire application.

---

# 18. Performance Requirements

HoverNotes should remain lightweight because it is intended to run continuously.

Targets:

```text
Startup        < 1 second where practical
Idle CPU       ~0%
Memory         minimal
Typing latency imperceptible
```

Avoid:

- polling loops
- unnecessary React rerenders
- constant disk writes
- heavy animation libraries
- embedded databases for MVP
- background network requests

---

# 19. Security / Privacy Requirements

All notes should remain local by default.

MVP should perform:

```text
0 cloud requests
0 analytics requests
0 account authentication
```

The application should work completely offline.

Later cloud-sync support must be opt-in.

---

# 20. MVP Acceptance Criteria

The MVP is considered successful when the following work reliably:

- [ ] Application launches as a desktop application
- [ ] User can create a note
- [ ] Note appears as a frameless floating window
- [ ] Note stays above VS Code
- [ ] Note stays above Chrome
- [ ] Note stays above Terminal
- [ ] User can type inside the note
- [ ] User can drag the note
- [ ] User can resize the note
- [ ] Note automatically saves
- [ ] Note restores after application restart
- [ ] User can pin/unpin the note
- [ ] User can change opacity
- [ ] User can create multiple notes
- [ ] Global new-note shortcut works
- [ ] Global show/hide shortcut works
- [ ] Closing a note does not kill the entire application
- [ ] Application can run from the system tray
- [ ] Notes restore onto valid monitors

---

# 21. Development Phases

## Phase 1 — Desktop Shell

Goal:

> Prove native floating-window behavior.

Build:

- Tauri application
- React frontend
- one frameless note
- draggable window
- resizable window
- always-on-top
- close button

Do not implement persistence yet.

Success condition:

> A note can remain over VS Code while the user works.

---

## Phase 2 — Notes System

Implement:

- Note model
- multiple notes
- note IDs
- create/delete notes
- local persistence
- auto-save
- restore notes at startup

Success condition:

> Restarting HoverNotes restores all notes exactly where they were.

---

## Phase 3 — Overlay Features

Implement:

- opacity controls
- pin/unpin
- lock position
- click-through mode
- emergency shortcut to recover interactive mode

Success condition:

> A transparent note can remain visible while mouse interaction continues with the application underneath.

---

## Phase 4 — Desktop Integration

Implement:

- system tray
- global shortcuts
- show/hide all
- startup behavior
- monitor detection
- multi-monitor recovery

Success condition:

> HoverNotes behaves like a native background desktop utility.

---

## Phase 5 — Polish

Implement:

- themes
- keyboard-first controls
- subtle toolbar animations
- better resize behavior
- settings screen
- configurable shortcuts
- crash-safe persistence
- packaging

Success condition:

> Application feels stable enough to use throughout the workday.

---

# 22. Future Features

## Application-Aware Notes

Allow notes to be associated with applications.

Example:

```text
Note A
attachedTo = vscode.exe

Note B
attachedTo = chrome.exe
```

Behavior:

```text
VS Code becomes active
        ↓
show VS Code notes

Chrome becomes active
        ↓
hide VS Code notes
show Chrome notes
```

---

## Workspace Notes

Example:

```text
Coding Workspace

├── API TODO
├── Database Notes
└── Debug Checklist
```

Switching workspace shows a different note collection.

---

## Markdown

Support:

```text
# headings
- lists
**bold**
`code`
```

---

## Code Note Mode

Special note optimized for snippets:

```ts
const cache = await redis.get(key);

if (!cache) {
  // inspect why this executes repeatedly
}
```

---

## Reminders

```text
Remind me about this note:
Today 6 PM
Tomorrow
In 30 minutes
```

---

## Note History

Store revisions:

```text
Note
├── version 1
├── version 2
├── version 3
└── current
```

---

## Search

Global search:

```text
Ctrl + Shift + F

"redis"

→ Redis Bug
→ Cache Architecture
→ Production Incident
```

---

# 23. Interesting Advanced Feature — Contextual Overlay

A future version can make sticky notes context-aware.

Example:

```text
VS Code
  │
  └── project: payment-service
             │
             ▼
       HoverNotes detects app
             │
             ▼
       Display relevant notes
```

Possible association hierarchy:

```text
Global Note
     │
Application Note
     │
Workspace Note
     │
Project Note
```

Example:

```text
Global
  "Drink water"

VS Code
  "Remember Ctrl+P"

payment-service
  "Check idempotency before release"
```

This can become one of HoverNotes' strongest differentiating features.

---

# 24. Architectural Principles

### 1. Local First

Notes must remain useful without internet access.

### 2. Native Window Behavior First

The difficult engineering problem is not the text editor.

It is:

```text
Desktop Window Management
```

Focus engineering effort there.

### 3. Separate UI and OS Logic

React should never contain platform-specific window-management code.

Use:

```text
React
   ↓
WindowService
   ↓
Tauri Command
   ↓
OS
```

### 4. Event Driven

Do not constantly poll window state.

Prefer events:

```text
window moved
window resized
window focused
note edited
shortcut triggered
monitor changed
```

### 5. Minimal Background Cost

HoverNotes may run for 8-12 hours per day.

Every architecture decision should assume:

> The application stays open continuously.

---

# 25. Final MVP Architecture

```text
                     HoverNotes
                         │
          ┌──────────────┴──────────────┐
          │                             │
       React UI                    Tauri Core
          │                             │
 ┌────────┼─────────┐        ┌──────────┼──────────┐
 │        │         │        │          │          │
Editor  Toolbar   Store   WindowMgr  ShortcutMgr  Tray
 │                  │        │
 │                  │        │
 └──────────┬───────┘        │
            │                │
       StorageService         │
            │                │
            ▼                ▼
       Local Storage      OS Windows
                             │
               ┌─────────────┼─────────────┐
               │             │             │
             Note 1        Note 2        Note 3
               │             │             │
               └─────────────┴─────────────┘
                         │
                   Always On Top
```

---

# 26. First Engineering Milestone

Do **not** begin by building the entire note manager.

The first technical experiment should answer one question:

> Can HoverNotes reliably create a frameless React-powered window that remains above VS Code, Chrome, and Terminal while still allowing normal typing and dragging?

Build only:

```text
Tauri
  +
React
  +
One Note Window
  +
Always On Top
  +
Drag
  +
Resize
```

Once that behavior works reliably, build the persistence and multi-note architecture around it.

That prevents spending time building note-management features before validating the most important native capability.

---

# 27. Open Decisions (Resolve Before / During Phase 1)

These are unresolved choices the rest of the spec silently depends on. Each should be
decided explicitly — ideally with a measurement, not a guess — before the multi-note
architecture is built on top of it.

## OD-1 — Window model: multi-window vs. single overlay  ⚠️ blocks everything

The spec assumes **one native `WebviewWindow` per note** (§6). This directly contradicts
the "minimal memory / <1s startup" targets (§18), because each `WebviewWindow` is a
separate OS webview (WebView2 on Windows) with its own JS runtime.

- [ ] Prototype note #1 as an independent window (current plan)
- [ ] Prototype note #1 as an element inside a single desktop-spanning overlay window
- [ ] Measure RSS with 1, 5, and 10 notes for each approach
- [ ] Decide, and record the memory/startup numbers here

Decision: __________  (record measured numbers)

## OD-2 — Position/size source of truth

`Note.position`/`Note.size` (§7) are also owned by the OS window, which emits its own
move/resize events (§12). Two writers, one truth.

- [ ] Declare the rule: **OS window is authoritative; the store is a persisted mirror**
      updated only on the debounced move/resize event.

## OD-3 — Global shortcut collisions

`Ctrl+Shift+N` (§12) collides with Chrome/Edge "New Incognito Window" — a guaranteed
conflict for the target audience.

- [ ] Pick non-colliding defaults
- [ ] Confirm the "failed shortcut registration" fallback (§17) actually surfaces to the user

## OD-4 — Click-through excludes all interaction

`setIgnoreCursorEvents(true)` makes the **entire** window ignore the mouse, including the
drag handle and toolbar (FR-010 vs FR-003).

- [ ] Confirm the model: click-through ⇒ no interaction until the emergency toggle (§10) is pressed
- [ ] Verify the emergency toggle is a **global** shortcut (works when the note can't be clicked)

## OD-5 — Multi-monitor DPI scaling

§15 handles disconnection but not per-monitor DPI. Saved logical `x/y` from a 150%-scaled
monitor can land off-screen on a 100% monitor.

- [ ] "Validate monitor positions" (§16) must intersect saved rects against current monitor
      geometry **at current scale**, not just "is it on a screen"
- [ ] Add unmovable/off-screen recovery (frameless windows have no title bar to grab)

## OD-6 — Tauri version pin

The `WebviewWindow` snippet (§9) reads as Tauri v1. Transparency, `setIgnoreCursorEvents`,
and the import path differ in v2.

- [ ] Pin the Tauri major version and update §9 to match the real API
- [ ] Confirm WebView2 runtime is present on target Windows machines (usually is on Win11)
