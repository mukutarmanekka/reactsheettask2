import { useCallback } from 'react';
import Cell from './Cell';
import { COLUMNS, ROWS } from '../engine';

/**
 * Grid Component
 *
 * Renders the 10×10 spreadsheet table with column + row headers.
 * Delegates cell editing to the Cell component.
 */
export default function Grid({ cells, selectedCell, onCommit, onSelect, onNavigate }) {
  const getCell = useCallback(
    (id) => {
      return cells.get(id) || { raw: '', display: '', error: false };
    },
    [cells]
  );

  return (
    <div className="grid-wrapper">
      <table className="grid">
        <thead>
          <tr>
            <th className="grid__corner"></th>
            {COLUMNS.map((col) => (
              <th key={col} className="grid__col-header">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <th className="grid__row-header">{row}</th>
              {COLUMNS.map((col) => {
                const cellId = `${col}${row}`;
                const cell = getCell(cellId);
                return (
                  <Cell
                    key={cellId}
                    cellId={cellId}
                    raw={cell.raw}
                    display={cell.display}
                    error={cell.error}
                    isSelected={selectedCell === cellId}
                    onCommit={onCommit}
                    onSelect={onSelect}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
