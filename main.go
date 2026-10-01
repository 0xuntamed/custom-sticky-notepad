package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

// HoverNotes MVP — single always-on-top translucent "board" window that holds
// many notes (Wails v2 is single-window; see OD-1 in the requirements doc).
func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "HoverNotes",
		Width:  480,
		Height: 560,

		Frameless:   true, // custom title bar, floating-overlay look
		AlwaysOnTop: true, // FR-002 (whole board stays on top)
		MinWidth:    320,
		MinHeight:   240,

		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0}, // fully transparent
		OnStartup:        app.startup,
		OnBeforeClose:    app.beforeClose, // ✕ hides to tray instead of quitting (§15)
		Bind: []interface{}{
			app,
		},

		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
