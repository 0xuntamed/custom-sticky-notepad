import { useCallback, useEffect, useRef, useState } from "react";
import { Note } from "../types/note";
import { LoadNotes, SaveNotes } from "../../wailsjs/go/main/App";

// useNotes owns the note collection: it loads once from the Go backend on
// startup (FR-014 restore) and persists changes with a debounce (FR-006
// auto-save). The Go side does the actual disk I/O.
export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loaded, setLoaded] = useState(false);
    const saveTimer = useRef<number | null>(null);

    // Load once on mount.
    useEffect(() => {
        // The Wails-generated model types `theme` as string; cast to our stricter
        // hand-written Note type at this boundary.
        LoadNotes()
            .then((nf) => setNotes((nf?.notes ?? []) as unknown as Note[]))
            .catch(() => setNotes([]))
            .finally(() => setLoaded(true));
    }, []);

    // Debounced persistence — never write on every keystroke (§18).
    useEffect(() => {
        if (!loaded) return; // don't overwrite disk before the first load lands
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            SaveNotes({ version: 1, notes } as any).catch((e) =>
                console.error("save failed", e),
            );
        }, 400);
        return () => {
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
        };
    }, [notes, loaded]);

    const addNote = useCallback((note: Note) => {
        setNotes((prev) => [...prev, note]);
    }, []);

    // Patch one note by id and stamp updatedAt.
    const updateNote = useCallback((id: string, patch: Partial<Note>) => {
        setNotes((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
            ),
        );
    }, []);

    const removeNote = useCallback((id: string) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return { notes, loaded, addNote, updateNote, removeNote };
}
