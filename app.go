package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ---- Data model (mirrors HOVERNOTES_ARCHITECTURE_REQUIREMENTS.md §7) ----

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Size struct {
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

type Appearance struct {
	Opacity float64 `json:"opacity"`
	Theme   string  `json:"theme"`
}

type Behavior struct {
	AlwaysOnTop  bool `json:"alwaysOnTop"`
	ClickThrough bool `json:"clickThrough"`
	Locked       bool `json:"locked"`
}

type Note struct {
	ID         string     `json:"id"`
	Title      string     `json:"title,omitempty"`
	Content    string     `json:"content"`
	Position   Position   `json:"position"`
	Size       Size       `json:"size"`
	Appearance Appearance `json:"appearance"`
	Behavior   Behavior   `json:"behavior"`
	CreatedAt  int64      `json:"createdAt"`
	UpdatedAt  int64      `json:"updatedAt"`
}

// NotesFile is the on-disk persistence format (§13).
type NotesFile struct {
	Version int    `json:"version"`
	Notes   []Note `json:"notes"`
}

// App struct
type App struct {
	ctx           context.Context
	alwaysOnTop   bool
	windowVisible bool
	quitting      bool
}

func NewApp() *App {
	return &App{alwaysOnTop: true, windowVisible: true}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Run the tray loop and global-hotkey listeners alongside the UI.
	go a.startTray()
	go a.startHotkeys()
}

// ---- Persistence (§13, error handling §17) ----

// storagePath returns %APPDATA%/HoverNotes/notes.json (or the OS equivalent).
func storagePath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(dir, "HoverNotes")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(appDir, "notes.json"), nil
}

// LoadNotes reads notes from disk. Missing file -> empty set. Corrupted file ->
// back it up and start clean, so one bad write never loses the app (§17).
func (a *App) LoadNotes() NotesFile {
	empty := NotesFile{Version: 1, Notes: []Note{}}

	path, err := storagePath()
	if err != nil {
		return empty
	}

	data, err := os.ReadFile(path)
	if err != nil {
		// Most commonly: file does not exist yet. Fall back to empty.
		return empty
	}

	var nf NotesFile
	if err := json.Unmarshal(data, &nf); err != nil {
		// Corrupted JSON: preserve it for recovery, then start clean.
		_ = os.Rename(path, path+".corrupt-"+time.Now().Format("20060102-150405")+".bak")
		return empty
	}

	if nf.Notes == nil {
		nf.Notes = []Note{}
	}
	if nf.Version == 0 {
		nf.Version = 1
	}
	return nf
}

// SaveNotes writes notes atomically (temp file + rename) so a crash mid-write
// cannot corrupt the real file (§17, §24.5).
func (a *App) SaveNotes(nf NotesFile) error {
	path, err := storagePath()
	if err != nil {
		return err
	}
	if nf.Version == 0 {
		nf.Version = 1
	}

	data, err := json.MarshalIndent(nf, "", "  ")
	if err != nil {
		return err
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// ---- Window controls (the WindowService seam, §10) ----

// TogglePin flips always-on-top for the whole board window (FR-002 / FR-008).
func (a *App) TogglePin() bool {
	a.alwaysOnTop = !a.alwaysOnTop
	runtime.WindowSetAlwaysOnTop(a.ctx, a.alwaysOnTop)
	return a.alwaysOnTop
}

// IsPinned reports the current always-on-top state (for UI restore).
func (a *App) IsPinned() bool {
	return a.alwaysOnTop
}

// MinimizeWindow hides the board to the taskbar.
func (a *App) MinimizeWindow() {
	runtime.WindowMinimise(a.ctx)
}

// Real exit lives in desktop.go as QuitApp (it sets the quitting flag so
// beforeClose allows the window to close). The window's ✕ only hides to tray.
