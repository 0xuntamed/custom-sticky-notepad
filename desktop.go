package main

import (
	"context"
	_ "embed"
	"log"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/hotkey"
)

// Tray icon (reuse the app icon Wails scaffolds for Windows).
//
//go:embed build/windows/icon.ico
var trayIcon []byte

// ---- Actions shared by the tray menu and the global hotkeys ----

// NewNote shows the board (if hidden) and asks the frontend to create a note.
// The actual note is created in React (it owns the note model); Go just signals.
func (a *App) NewNote() {
	a.ShowWindow()
	runtime.EventsEmit(a.ctx, "app:new-note")
}

// ShowWindow / HideWindow / ToggleWindow implement FR-013 (show / hide all).
func (a *App) ShowWindow() {
	runtime.WindowShow(a.ctx)
	a.windowVisible = true
}

func (a *App) HideWindow() {
	runtime.WindowHide(a.ctx)
	a.windowVisible = false
}

func (a *App) ToggleWindow() {
	if a.windowVisible {
		a.HideWindow()
	} else {
		a.ShowWindow()
	}
}

// QuitApp performs a real exit (the only path that actually terminates — the
// window's close button only hides to the tray, §15).
func (a *App) QuitApp() {
	a.quitting = true
	runtime.Quit(a.ctx)
}

// beforeClose intercepts the OS/window close (✕, Alt+F4). Unless we're really
// quitting (via the tray), hide to the tray and keep running (§15, §20:
// "closing a note does not kill the entire application").
func (a *App) beforeClose(_ context.Context) bool {
	if a.quitting {
		return false // allow the close -> app exits
	}
	a.HideWindow()
	return true // prevent the close -> stay alive in the tray
}

// ---- System tray (§15) ----

func (a *App) startTray() {
	systray.Run(a.onTrayReady, func() {})
}

func (a *App) onTrayReady() {
	systray.SetIcon(trayIcon)
	systray.SetTitle("HoverNotes")
	systray.SetTooltip("HoverNotes")

	mNew := systray.AddMenuItem("New Note", "Create a new note")
	systray.AddSeparator()
	mShow := systray.AddMenuItem("Show All Notes", "Bring the board back")
	mHide := systray.AddMenuItem("Hide All Notes", "Hide the board")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Quit HoverNotes")

	mNew.Click(func() { a.NewNote() })
	mShow.Click(func() { a.ShowWindow() })
	mHide.Click(func() { a.HideWindow() })
	mQuit.Click(func() { a.QuitApp() })

	// Left-click the tray icon toggles the board.
	systray.SetOnClick(func(_ systray.IMenu) { a.ToggleWindow() })
}

// ---- Global hotkeys (FR-012 / FR-013) ----

// Ctrl+Alt+N and Ctrl+Alt+H — deliberately NOT Ctrl+Shift+N, which collides
// with Chrome/Edge "New Incognito Window" (OD-3 in the requirements doc).
func (a *App) startHotkeys() {
	register := func(mods []hotkey.Modifier, key hotkey.Key, action func(), label string) {
		hk := hotkey.New(mods, key)
		if err := hk.Register(); err != nil {
			// FR-012: failed registration must not crash the app.
			log.Printf("hotkey %s unavailable: %v", label, err)
			return
		}
		go func() {
			for range hk.Keydown() {
				action()
			}
		}()
	}

	register([]hotkey.Modifier{hotkey.ModCtrl, hotkey.ModAlt}, hotkey.KeyN, a.NewNote, "Ctrl+Alt+N")
	register([]hotkey.Modifier{hotkey.ModCtrl, hotkey.ModAlt}, hotkey.KeyH, a.ToggleWindow, "Ctrl+Alt+H")
}
