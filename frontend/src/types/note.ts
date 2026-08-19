// Data model — mirrors HOVERNOTES_ARCHITECTURE_REQUIREMENTS.md §7 and the Go
// structs in app.go. Kept hand-written (rather than importing the generated
// Wails models) so the UI has a single, clear source of truth.

export type NoteTheme = "yellow" | "blue" | "green" | "pink" | "dark";

export const THEMES: NoteTheme[] = ["yellow", "blue", "green", "pink", "dark"];

export interface Note {
    id: string;
    title?: string;
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    appearance: { opacity: number; theme: NoteTheme };
    behavior: { alwaysOnTop: boolean; clickThrough: boolean; locked: boolean };
    createdAt: number;
    updatedAt: number;
}

export interface NotesFile {
    version: number;
    notes: Note[];
}

// FR-001 default note. Cards live on the board canvas, so the default is a bit
// smaller than the spec's 320×280 window default.
export function createNote(x: number, y: number): Note {
    const now = Date.now();
    return {
        id: `note_${now}_${Math.random().toString(36).slice(2, 7)}`,
        title: "",
        content: "",
        position: { x, y },
        size: { width: 240, height: 200 },
        appearance: { opacity: 1, theme: "yellow" },
        behavior: { alwaysOnTop: true, clickThrough: false, locked: false },
        createdAt: now,
        updatedAt: now,
    };
}

// FR-004 minimum note size.
export const MIN_W = 160;
export const MIN_H = 100;
