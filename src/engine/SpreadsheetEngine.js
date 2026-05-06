import { parseFormula, evaluateFormula } from './parser';
import { DependencyGraph } from './dependencyGraph';

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const ERROR_CIRCULAR = '#CIRCULAR';
export const ERROR_GENERIC = '#ERROR';

export function allCellIds() {
  const ids = [];
  for (const col of COLUMNS) {
    for (const row of ROWS) {
      ids.push(`${col}${row}`);
    }
  }
  return ids;
}

export function isValidCellId(id) {
  if (!id || typeof id !== 'string') return false;
  const match = id.match(/^([A-J])(\d+)$/);
  if (!match) return false;
  const row = parseInt(match[2], 10);
  return row >= 1 && row <= 10;
}

function createEmptyCell() {
  return {
    raw: '',
    display: '',
    error: false,
    ast: null,
    refs: [],
  };
}

export class SpreadsheetEngine {
  constructor() {
    this.graph = new DependencyGraph();
    this.cells = new Map();
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;

    for (const id of allCellIds()) {
      this.cells.set(id, createEmptyCell());
    }
  }

  _snapshot() {
    const snap = new Map();
    for (const [id, cell] of this.cells) {
      snap.set(id, cell.raw);
    }
    return snap;
  }

  _restoreSnapshot(snap) {
    this.graph = new DependencyGraph();

    for (const id of allCellIds()) {
      this.cells.set(id, createEmptyCell());
    }

    const formulaCells = [];
    for (const [id, raw] of snap) {
      if (raw === '') continue;
      if (raw.startsWith('=')) {
        formulaCells.push([id, raw]);
      } else {
        this._applyCellRaw(id, raw, false);
      }
    }

    for (const [id, raw] of formulaCells) {
      this._applyCellRaw(id, raw, false);
    }

    for (const [id] of formulaCells) {
      this._evaluateCell(id);
    }

    return new Map(this.cells);
  }

  setCellRaw(cellId, rawInput) {
    this.undoStack.push(this._snapshot());
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];

    this._applyCellRaw(cellId, rawInput, true);

    return new Map(this.cells);
  }

  _applyCellRaw(cellId, rawInput, cascade) {
    const cell = { ...createEmptyCell(), raw: rawInput };

    if (rawInput.startsWith('=')) {
      const formulaBody = rawInput.slice(1).trim();
      if (formulaBody === '') {
        cell.display = ERROR_GENERIC;
        cell.error = true;
        this.cells.set(cellId, cell);
        this.graph.clearDependencies(cellId);
        if (cascade) this._cascadeRecalc(cellId);
        return;
      }

      try {
        const { ast, refs } = parseFormula(formulaBody);

        for (const ref of refs) {
          if (!isValidCellId(ref)) {
            throw new Error(`Invalid cell reference: ${ref}`);
          }
        }

        if (this.graph.wouldCreateCycle(cellId, refs)) {
          cell.display = ERROR_CIRCULAR;
          cell.error = true;
          cell.ast = null;
          cell.refs = refs;
          this.cells.set(cellId, cell);
          this.graph.clearDependencies(cellId);
          if (cascade) this._cascadeRecalc(cellId);
          return;
        }

        cell.ast = ast;
        cell.refs = refs;

        this.graph.setDependencies(cellId, refs);

        this.cells.set(cellId, cell);
        this._evaluateCell(cellId);
      } catch (err) {
        cell.display = ERROR_GENERIC;
        cell.error = true;
        this.cells.set(cellId, cell);
        this.graph.clearDependencies(cellId);
      }
    } else {
      cell.display = rawInput;
      this.graph.clearDependencies(cellId);
      this.cells.set(cellId, cell);
    }

    if (cascade) {
      this._cascadeRecalc(cellId);
    }
  }

  _evaluateCell(cellId) {
    const cell = this.cells.get(cellId);
    if (!cell || !cell.ast) return;

    try {
      const result = evaluateFormula(cell.ast, (refId) => {
        const refCell = this.cells.get(refId);
        if (!refCell) throw new Error(`Unknown cell: ${refId}`);
        if (refCell.error) throw new Error(`Referenced cell ${refId} has an error`);
        return refCell.display;
      });

      const display = Number.isFinite(result)
        ? parseFloat(result.toFixed(10)).toString()
        : String(result);

      this.cells.set(cellId, { ...cell, display, error: false });
    } catch {
      this.cells.set(cellId, { ...cell, display: ERROR_GENERIC, error: true });
    }
  }

  _cascadeRecalc(cellId) {
    const order = this.graph.getRecalcOrder(cellId);
    for (const id of order) {
      this._evaluateCell(id);
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return new Map(this.cells);
    this.redoStack.push(this._snapshot());
    const snap = this.undoStack.pop();
    return this._restoreSnapshot(snap);
  }

  redo() {
    if (!this.canRedo()) return new Map(this.cells);
    this.undoStack.push(this._snapshot());
    const snap = this.redoStack.pop();
    return this._restoreSnapshot(snap);
  }

  getCell(cellId) {
    return this.cells.get(cellId) || createEmptyCell();
  }

  getCellsMap() {
    return new Map(this.cells);
  }
}
