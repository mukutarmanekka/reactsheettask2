import { useState, useCallback, useRef, useEffect } from 'react';
import Grid from './components/Grid';
import Toolbar from './components/Toolbar';
import { SpreadsheetEngine, COLUMNS, ROWS } from './engine';
import './App.css';

/**
 * App — root component.
 *
 * Owns the SpreadsheetEngine instance (via useRef so it survives re-renders)
 * and the reactive `cells` Map (via useState so React re-renders on changes).
 */
export default function App() {
  const engineRef = useRef(null);

  // Lazy-init engine once
  if (!engineRef.current) {
    engineRef.current = new SpreadsheetEngine();
  }
  const engine = engineRef.current;

  const [cells, setCells] = useState(() => engine.getCellsMap());
  const [selectedCell, setSelectedCell] = useState('A1');

  // ── Cell editing ──────────────────────────────────────────────────────────

  const handleCommit = useCallback(
    (cellId, rawInput) => {
      const newCells = engine.setCellRaw(cellId, rawInput);
      setCells(newCells);
    },
    [engine]
  );

  const handleSelect = useCallback((cellId) => {
    setSelectedCell(cellId);
  }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────

  const handleNavigate = useCallback(
    (fromCellId, direction) => {
      const colIdx = COLUMNS.indexOf(fromCellId[0]);
      const row = parseInt(fromCellId.slice(1), 10);

      let newCol = colIdx;
      let newRow = row;

      switch (direction) {
        case 'up':    newRow = Math.max(1, row - 1); break;
        case 'down':  newRow = Math.min(10, row + 1); break;
        case 'left':  newCol = Math.max(0, colIdx - 1); break;
        case 'right': newCol = Math.min(COLUMNS.length - 1, colIdx + 1); break;
      }

      const newCellId = `${COLUMNS[newCol]}${newRow}`;
      setSelectedCell(newCellId);

      // Focus the new cell's input
      requestAnimationFrame(() => {
        const input = document.querySelector(`[data-cell-id="${newCellId}"]`);
        if (input) input.focus();
      });
    },
    []
  );

  // ── Undo / Redo ──────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const newCells = engine.undo();
    setCells(newCells);
  }, [engine]);

  const handleRedo = useCallback(() => {
    const newCells = engine.redo();
    setCells(newCells);
  }, [engine]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ── Derived state ────────────────────────────────────────────────────────

  const selectedCellData = cells.get(selectedCell);
  const selectedCellRaw = selectedCellData ? selectedCellData.raw : '';

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          <span className="app__logo">⊞</span> ReactSheet
        </h1>
        <p className="app__subtitle">Client-side spreadsheet with formula engine</p>
      </header>

      <Toolbar
        selectedCell={selectedCell}
        selectedCellRaw={selectedCellRaw}
        canUndo={engine.canUndo()}
        canRedo={engine.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <Grid
        cells={cells}
        selectedCell={selectedCell}
        onCommit={handleCommit}
        onSelect={handleSelect}
        onNavigate={handleNavigate}
      />

      <footer className="app__footer">
        <span>Enter a value or formula (e.g. <code>=A1+B2*3</code>)</span>
        <span className="app__footer-sep">•</span>
        <span><kbd>Enter</kbd> to confirm & move down</span>
        <span className="app__footer-sep">•</span>
        <span><kbd>Tab</kbd> to move right</span>
        <span className="app__footer-sep">•</span>
        <span><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd> undo/redo</span>
      </footer>
    </div>
  );
}
