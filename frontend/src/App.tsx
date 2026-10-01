import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Note } from "./components/Note";
import { useNotes } from "./hooks/useNotes";
import { createNote } from "./types/note";
import { TogglePin, MinimizeWindow, HideWindow } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";

function App() {
    const { notes, loaded, addNote, updateNote, removeNote } = useNotes();
    const [pinned, setPinned] = useState(true);

    // Create a note at a slightly randomized spot so new notes don't stack
    // exactly on top of each other.
    const newNote = useCallback(() => {
        const jitter = () => 24 + Math.round(Math.random() * 80);
        addNote(createNote(jitter(), jitter()));
    }, [addNote]);

    // Z-order: a list of note ids, last = on top. Kept separate from the notes
    // array so bringing a card to the front doesn't churn note data.
    const [order, setOrder] = useState<string[]>([]);
    useEffect(() => {
        // Keep the order list in sync as notes are added/removed.
        setOrder((prev) => {
            const ids = notes.map((n) => n.id);
            const kept = prev.filter((id) => ids.includes(id));
            const added = ids.filter((id) => !kept.includes(id));
            return [...kept, ...added];
        });
    }, [notes]);

    // Bring a note to the front by moving its id to the end of the order list.
    const focusNote = useCallback((id: string) => {
        setOrder((prev) =>
            prev[prev.length - 1] === id ? prev : [...prev.filter((x) => x !== id), id],
        );
    }, []);

    async function togglePin() {
        setPinned(await TogglePin());
    }

    // In-window Ctrl/Cmd+Shift+N (works while the board is focused). The global
    // version (works from any app) is Ctrl+Alt+N, registered in Go (desktop.go).
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "n") {
                e.preventDefault();
                newNote();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [newNote]);

    // The tray menu and the global hotkey create notes by emitting this event.
    useEffect(() => {
        return EventsOn("app:new-note", () => newNote());
    }, [newNote]);

    const ordered = order
        .map((id) => notes.find((n) => n.id === id))
        .filter((n): n is NonNullable<typeof n> => Boolean(n));

    return (
        <div className="board">
            {/* Title bar — the only OS-draggable region (Wails --wails-draggable). */}
            <div className="board__bar" style={{ "--wails-draggable": "drag" } as React.CSSProperties}>
                <span className="board__title">📝 HoverNotes</span>
                <button className="board__btn board__btn--accent" onClick={newNote} title="New note (global: Ctrl+Alt+N)">
                    ＋ New
                </button>
                <span className="board__spacer" />
                <button
                    className={`board__btn ${pinned ? "is-active" : ""}`}
                    onClick={togglePin}
                    title={pinned ? "Pinned — always on top" : "Not pinned"}
                >
                    📌
                </button>
                <button className="board__btn" onClick={() => MinimizeWindow()} title="Minimize">
                    —
                </button>
                <button
                    className="board__btn"
                    onClick={() => HideWindow()}
                    title="Hide to tray (quit from the tray icon)"
                >
                    ✕
                </button>
            </div>

            <div className="board__canvas">
                {loaded && notes.length === 0 && (
                    <div className="board__empty">
                        <p>No notes yet.</p>
                        <button className="board__btn board__btn--accent" onClick={newNote}>
                            ＋ Create your first note
                        </button>
                    </div>
                )}

                {ordered.map((n) => (
                    <Note
                        key={n.id}
                        note={n}
                        onChange={(patch) => updateNote(n.id, patch)}
                        onRemove={() => removeNote(n.id)}
                        onFocus={() => focusNote(n.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
