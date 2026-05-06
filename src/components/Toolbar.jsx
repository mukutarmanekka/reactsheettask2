/**
 * Toolbar Component
 *
 * Shows:
 *  - The currently selected cell ID
 *  - The raw formula/content of the selected cell (formula bar)
 *  - Undo / Redo buttons
 */
export default function Toolbar({
  selectedCell,
  selectedCellRaw,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar__actions">
        <button
          className="toolbar__btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Undo</span>
        </button>
        <button
          className="toolbar__btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
          <span>Redo</span>
        </button>
      </div>

      <div className="toolbar__cell-info">
        <span className="toolbar__cell-id">{selectedCell || '—'}</span>
        <div className="toolbar__formula-bar">
          <span className="toolbar__fx">fx</span>
          <span className="toolbar__formula-text">
            {selectedCellRaw || ''}
          </span>
        </div>
      </div>
    </div>
  );
}
