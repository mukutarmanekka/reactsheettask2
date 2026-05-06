# ⊞ ReactSheet — Spreadsheet Engine

A complete client-side spreadsheet engine built with React featuring formula evaluation, dependency tracking, and circular reference detection.

## 🌐 Live Demo

**[https://reactsheettask2.vercel.app/](https://reactsheettask2.vercel.app/)**

---

## 📋 Overview

ReactSheet is a 10×10 editable spreadsheet grid where users can enter plain values or formulas. The app automatically evaluates formulas, recalculates dependent cells when a referenced cell changes, and detects circular references — all without freezing or crashing.

### Key Features

- **10×10 Editable Grid** — Columns A–J, Rows 1–10, spreadsheet-style cell identifiers (A1, B4, J10)
- **Formula Evaluation** — Supports `=A1+B2`, `=A1*2`, `=(C1+D1)/3` with `+`, `-`, `*`, `/` and parentheses
- **Dependency Tracking** — Automatic cascading recalculation when referenced cells change
- **Circular Reference Detection** — Detects cycles like `A1=B1, B1=A1` and displays `#CIRCULAR`
- **Error Handling** — Invalid formulas show `#ERROR` without breaking the rest of the grid
- **Undo/Redo** — Full history support with `Ctrl+Z` / `Ctrl+Y` (50 levels)
- **Keyboard Navigation** — Arrow keys, Tab, Enter, Escape for efficient editing
- **Client-Side Only** — No backend required, runs entirely in the browser

---

## 🏗️ Architecture

```
src/
├── engine/
│   ├── parser.js              # Tokenizer + recursive-descent parser + AST evaluator
│   ├── dependencyGraph.js     # Directed graph with cycle detection + topological sort
│   ├── SpreadsheetEngine.js   # Core state manager: cells, formulas, undo/redo
│   └── index.js               # Barrel export
├── components/
│   ├── Cell.jsx               # Single editable cell with edit/display modes
│   ├── Grid.jsx               # 10×10 table with column and row headers
│   └── Toolbar.jsx            # Undo/Redo buttons + formula bar
├── App.jsx                    # Root component — wires engine to React state
├── App.css                    # Complete dark-theme stylesheet
└── main.jsx                   # Application entry point
```

### How It Works

1. **Formula Parsing** — A recursive-descent parser tokenizes formulas and builds an AST (Abstract Syntax Tree) supporting operator precedence and parentheses.

2. **Dependency Graph** — When a formula like `=A1+B2` is entered in C1, the graph records that C1 depends on A1 and B2. Reverse edges track which cells need recalculation.

3. **Cycle Detection** — Before committing any formula, the engine performs a DFS traversal to check if the new dependencies would create a cycle. If so, the cell shows `#CIRCULAR` and the edges are not committed.

4. **Cascading Recalculation** — When a cell value changes, Kahn's topological sort algorithm determines the correct recalculation order for all affected dependent cells, ensuring dependencies are evaluated before their dependents.

5. **Undo/Redo** — Each edit captures a snapshot of all cell raw values. Restoring a snapshot replays all values through the engine to rebuild the full state.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/mukutarmanekka/React-Spreadsheet-Engine-with-Formula-Evaluation-and-Dependency-Tracking.git

# Navigate to the project directory
cd React-Spreadsheet-Engine-with-Formula-Evaluation-and-Dependency-Tracking

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173/**

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The production output is generated in the `dist/` folder.

---

## 🧪 Testing the Features

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Plain Values** | Type `5` in A1, `10` in B1 | Cells display the typed values |
| **Basic Formula** | Type `=A1+B1` in C1 | C1 shows `15` |
| **Cascading Updates** | Type `=C1*2` in D1, then change A1 to `20` | C1→30, D1→60 (auto-updates) |
| **Circular Reference** | Type `=G1+1` in F1, then `=F1+1` in G1 | G1 shows `#CIRCULAR` |
| **Error Handling** | Type `=+++` in any cell | Cell shows `#ERROR`, grid stays functional |
| **Parentheses** | Type `=(A1+B1)/3` in E1 | Evaluates correctly with operator precedence |
| **Undo/Redo** | Make edits, then press `Ctrl+Z` / `Ctrl+Y` | Changes revert and reapply correctly |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Confirm edit & move down |
| `Tab` | Confirm edit & move right |
| `Shift+Tab` | Confirm edit & move left |
| `Escape` | Cancel current edit |
| `Arrow Keys` | Navigate between cells |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

---

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool and dev server
- **Vanilla CSS** — Custom dark theme with CSS custom properties
- **No external dependencies** — Formula parser and dependency graph built from scratch

---

## 📝 Setup Notes

- This is a **client-side only** application — no backend or database is required.
- The formula parser is built from scratch using a recursive-descent approach — no external parsing libraries.
- The dependency graph uses **Kahn's algorithm** for topological sorting, ensuring correct evaluation order.
- Empty cells referenced in formulas are treated as `0` (standard spreadsheet behavior).
- The app supports column references A through J and row numbers 1 through 10.
- Formula results are numeric only; referencing a cell containing text in a formula will produce `#ERROR`.

---

## 📄 License

This project is open source and available for educational purposes.

---

## Author

**Mukut Arman Ekka**  
3rd Year CSE Student
