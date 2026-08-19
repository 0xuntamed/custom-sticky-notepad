import { useState, useRef } from "react";
import { Note as NoteModel, NoteTheme, THEMES, MIN_W, MIN_H } from "../types/note";

interface Props {
    note: NoteModel;
    onChange: (patch: Partial<NoteModel>) => void;
    onRemove: () => void;
    onFocus: () => void;
}

export function Note({ note, onChange, onRemove, onFocus }: Props) {
    // While a drag/resize is in progress the live geometry lives in local state,
    // so only THIS card re-renders per frame (not every note on the board) and
    // the store + auto-save are written just once, on pointer-up.
    const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);
    const [liveSize, setLiveSize] = useState<{ width: number; height: number } | null>(null);
    const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
    const resizeStart = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);

    const pos = livePos ?? note.position;
    const size = liveSize ?? note.size;
    const dragging = livePos !== null || liveSize !== null;

    // ---- Drag the card by its header (locked notes don't move, FR-011) ----
    function onHeaderPointerDown(e: React.PointerEvent) {
        if (note.behavior.locked) return;
        // Ignore presses that land on a header control.
        if ((e.target as HTMLElement).closest("button, input, select")) return;
        dragStart.current = { mx: e.clientX, my: e.clientY, x: note.position.x, y: note.position.y };
        setLivePos({ x: note.position.x, y: note.position.y });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onHeaderPointerMove(e: React.PointerEvent) {
        const d = dragStart.current;
        if (!d) return;
        setLivePos({
            x: Math.max(0, d.x + (e.clientX - d.mx)),
            y: Math.max(0, d.y + (e.clientY - d.my)),
        });
    }

    function endDrag() {
        if (dragStart.current && livePos) onChange({ position: livePos });
        dragStart.current = null;
        setLivePos(null);
    }

    // ---- Resize from the bottom-right corner (FR-004) ----
    function onResizePointerDown(e: React.PointerEvent) {
        if (note.behavior.locked) return;
        e.stopPropagation();
        resizeStart.current = { mx: e.clientX, my: e.clientY, w: note.size.width, h: note.size.height };
        setLiveSize({ width: note.size.width, height: note.size.height });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onResizePointerMove(e: React.PointerEvent) {
        const r = resizeStart.current;
        if (!r) return;
        setLiveSize({
            width: Math.max(MIN_W, r.w + (e.clientX - r.mx)),
            height: Math.max(MIN_H, r.h + (e.clientY - r.my)),
        });
    }

    function endResize() {
        if (resizeStart.current && liveSize) onChange({ size: liveSize });
        resizeStart.current = null;
        setLiveSize(null);
    }

    function cycleTheme() {
        const i = THEMES.indexOf(note.appearance.theme);
        const next: NoteTheme = THEMES[(i + 1) % THEMES.length];
        onChange({ appearance: { ...note.appearance, theme: next } });
    }

    function toggleLock() {
        onChange({ behavior: { ...note.behavior, locked: !note.behavior.locked } });
    }

    return (
        <div
            className={`card theme-${note.appearance.theme}${dragging ? " is-dragging" : ""}`}
            style={{
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height,
                opacity: note.appearance.opacity,
            }}
            onPointerDown={onFocus}
        >
            <div
                className="card__header"
                onPointerDown={onHeaderPointerDown}
                onPointerMove={onHeaderPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{ cursor: note.behavior.locked ? "default" : "move" }}
            >
                <button className="card__btn" title="Change color" onClick={cycleTheme}>
                    ●
                </button>
                <input
                    className="card__title"
                    value={note.title ?? ""}
                    placeholder="Untitled"
                    onChange={(e) => onChange({ title: e.target.value })}
                />
                <button
                    className={`card__btn ${note.behavior.locked ? "is-active" : ""}`}
                    title={note.behavior.locked ? "Locked" : "Unlocked"}
                    onClick={toggleLock}
                >
                    {note.behavior.locked ? "🔒" : "🔓"}
                </button>
                <button className="card__btn" title="Delete note" onClick={onRemove}>
                    ✕
                </button>
            </div>

            <textarea
                className="card__editor"
                value={note.content}
                placeholder="Type a note…"
                readOnly={note.behavior.locked}
                onChange={(e) => onChange({ content: e.target.value })}
            />

            <div className="card__footer">
                <input
                    className="card__opacity"
                    type="range"
                    min={0.4} /* FR-009: 40%–100% */
                    max={1}
                    step={0.05}
                    value={note.appearance.opacity}
                    title="Opacity"
                    onChange={(e) =>
                        onChange({
                            appearance: { ...note.appearance, opacity: Number(e.target.value) },
                        })
                    }
                />
            </div>

            {!note.behavior.locked && (
                <div
                    className="card__resize"
                    title="Resize"
                    onPointerDown={onResizePointerDown}
                    onPointerMove={onResizePointerMove}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                />
            )}
        </div>
    );
}
