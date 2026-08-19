# HoverNotes (Wails v2 + Go + React)

An always-on-top, translucent, frameless **notes board** that floats over your
other apps. Built per `../HOVERNOTES_ARCHITECTURE_REQUIREMENTS.md`, adapted to
the **Wails v2 floating-panel** architecture (decision OD-1 in that doc).

> **Why a "board" and not desktop-scattered windows?** Wails v2 is single-window
> and has no OS-level click-through (verified against the v2.15 runtime). The
> spec's "one OS window per note scattered across the desktop" needs Wails v3
> (alpha) or native Win32. So all notes live as cards inside one floating board.

## Run

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
wails dev                      # hot-reload development
# or the built binary:
./build/bin/hover-notes-spike.exe
```

Build a release binary:

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
wails build                    # -> build/bin/hover-notes-spike.exe  (~11 MB)
```

## What works (MVP)

| Feature | Spec | Notes |
|---|---|---|
| Always-on-top, frameless, translucent window | FR-002 | Whole board floats over other apps |
| Create note | FR-001 | ＋ New, or **Ctrl/Cmd+Shift+N** (while focused) |
| Edit note (plain text) | FR-005 | Native textarea = free undo/redo/copy/paste |
| Move note | FR-003 | Drag a card by its header |
| Resize note | FR-004 | Bottom-right handle; min 160×100 |
| Delete note | FR-007 | ✕ on the card |
| Per-note opacity | FR-009 | Slider, clamped 40–100% |
| Themes | §7 | Cycle yellow/blue/green/pink/dark (● button) |
| Lock note | FR-011 | 🔒 disables move/resize/edit |
| Pin board on/off | FR-002/008 | 📌 toggles always-on-top |
| Auto-save | FR-006 | Debounced 400 ms, atomic write |
| Restore on startup | FR-014 | Content, position, size, opacity, theme, lock |
| Z-order | — | Click a card to bring it to front |

Data is stored at `%APPDATA%/HoverNotes/notes.json` in the spec's format (§13),
written atomically (temp + rename) with corrupt-file backup (§17).

## Architecture

```
React (board + note cards)                     Go (app.go)
  useNotes  ── LoadNotes / SaveNotes ───────►  atomic JSON persistence
  Note.tsx  ── drag/resize/edit in-canvas
  App.tsx   ── TogglePin/Minimize/Quit ─────►  runtime window controls (§10 seam)
```

The Go methods are the **WindowService seam** (spec §10, §24.3): React never
touches the OS window directly — it calls bound Go functions.

## Deliberately out of scope for this v2 MVP

These need capabilities Wails v2 lacks (they're the OD-* decisions):

- **Desktop-scattered independent note windows** — needs Wails v3 / Win32 (OD-1).
- **Per-note click-through** (FR-010) — no `WindowSetIgnoreMouseEvents` in v2 (OD-4).
- **Global** shortcuts (FR-012/013) — the Ctrl+Shift+N here is window-local only;
  a true global hotkey needs a lib like `golang.design/x/hotkey` (OD-3).
- **System tray** (§15) — not built into Wails v2; needs an external tray lib.
- **Multi-monitor recovery** (FR-015) — `runtime.ScreenGetAll` exists to build it;
  not wired up yet (OD-5).
