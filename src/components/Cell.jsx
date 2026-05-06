import { useState, useCallback, useRef, useEffect, memo } from 'react';

/**
 * Cell Component
 *
 * Represents a single cell in the spreadsheet grid.
 * - Shows the computed display value when not focused.
 * - Shows the raw formula/input when focused for editing.
 * - Commits changes on blur or Enter.
 * - Navigates with Tab / Arrow keys.
 */
const Cell = memo(function Cell({
  cellId,
  raw,
  display,
  error,
  isSelected,
  onCommit,
  onSelect,
  onNavigate,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(raw);
  const inputRef = useRef(null);

  // Sync draft when raw changes externally (e.g. undo/redo)
  useEffect(() => {
    if (!editing) {
      setDraft(raw);
    }
  }, [raw, editing]);

  // Auto-focus when selected
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const handleFocus = useCallback(() => {
    setEditing(true);
    setDraft(raw);
    onSelect(cellId);
  }, [cellId, raw, onSelect]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (draft !== raw) {
      onCommit(cellId, draft);
    }
  }, [cellId, draft, raw, onCommit]);

  const handleChange = useCallback((e) => {
    setDraft(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Commit, then move down
        if (draft !== raw) {
          onCommit(cellId, draft);
        }
        setEditing(false);
        onNavigate(cellId, 'down');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (draft !== raw) {
          onCommit(cellId, draft);
        }
        setEditing(false);
        onNavigate(cellId, e.shiftKey ? 'left' : 'right');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setDraft(raw);
        setEditing(false);
      } else if (!editing) {
        // Arrow-key navigation when not actively editing
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onNavigate(cellId, 'up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onNavigate(cellId, 'down');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onNavigate(cellId, 'left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onNavigate(cellId, 'right');
        }
      }
    },
    [cellId, draft, raw, editing, onCommit, onNavigate]
  );

  // Build class list
  let className = 'cell';
  if (isSelected) className += ' cell--selected';
  if (error) className += ' cell--error';
  if (editing) className += ' cell--editing';

  return (
    <td className={className}>
      <input
        ref={inputRef}
        className="cell__input"
        type="text"
        value={editing ? draft : display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        aria-label={`Cell ${cellId}`}
        data-cell-id={cellId}
      />
    </td>
  );
});

export default Cell;
