/**
 * Formula Parser & Evaluator
 * 
 * Tokenizes and parses spreadsheet formulas into an AST,
 * then evaluates them against a cell-value lookup function.
 * 
 * Supports: +, -, *, /, parentheses, cell references (e.g. A1, J10),
 *           numeric literals, and unary minus.
 * 
 * Grammar (recursive descent):
 *   Expression  → Term (('+' | '-') Term)*
 *   Term        → Unary (('*' | '/') Unary)*
 *   Unary       → '-' Unary | Primary
 *   Primary     → NUMBER | CELL_REF | '(' Expression ')'
 */

// ── Token types ──────────────────────────────────────────────────────────────
const TokenType = {
  NUMBER: 'NUMBER',
  CELL_REF: 'CELL_REF',
  PLUS: '+',
  MINUS: '-',
  STAR: '*',
  SLASH: '/',
  LPAREN: '(',
  RPAREN: ')',
  EOF: 'EOF',
};

// ── Tokenizer ────────────────────────────────────────────────────────────────

/**
 * Converts a formula string (without the leading "=") into an array of tokens.
 * Throws on unrecognised characters.
 */
function tokenize(formula) {
  const tokens = [];
  let i = 0;
  const src = formula.trim();

  while (i < src.length) {
    const ch = src[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Single-character operators and parens
    if ('+-*/()'.includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }

    // Numbers (integers and decimals)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < src.length && /\d/.test(src[i + 1]))) {
      let num = '';
      while (i < src.length && (/\d/.test(src[i]) || src[i] === '.')) {
        num += src[i];
        i++;
      }
      tokens.push({ type: TokenType.NUMBER, value: num });
      continue;
    }

    // Cell references: one or two letters followed by one or more digits (e.g. A1, J10, AA5)
    if (/[A-Za-z]/.test(ch)) {
      let ref = '';
      while (i < src.length && /[A-Za-z]/.test(src[i])) {
        ref += src[i].toUpperCase();
        i++;
      }
      // Must be followed by digits to be a valid cell reference
      if (i < src.length && /\d/.test(src[i])) {
        while (i < src.length && /\d/.test(src[i])) {
          ref += src[i];
          i++;
        }
        tokens.push({ type: TokenType.CELL_REF, value: ref });
      } else {
        throw new Error(`Invalid identifier: ${ref}`);
      }
      continue;
    }

    throw new Error(`Unexpected character: '${ch}'`);
  }

  tokens.push({ type: TokenType.EOF, value: null });
  return tokens;
}

// ── Parser (recursive descent → AST) ────────────────────────────────────────

/**
 * Parse a token stream into an AST node tree.
 * Returns the root AST node.
 */
function parse(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume(expectedType) {
    const token = tokens[pos];
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected ${expectedType} but got ${token.type}`);
    }
    pos++;
    return token;
  }

  // Expression → Term (('+' | '-') Term)*
  function parseExpression() {
    let left = parseTerm();
    while (peek().type === TokenType.PLUS || peek().type === TokenType.MINUS) {
      const op = consume().type;
      const right = parseTerm();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Term → Unary (('*' | '/') Unary)*
  function parseTerm() {
    let left = parseUnary();
    while (peek().type === TokenType.STAR || peek().type === TokenType.SLASH) {
      const op = consume().type;
      const right = parseUnary();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Unary → '-' Unary | Primary
  function parseUnary() {
    if (peek().type === TokenType.MINUS) {
      consume();
      const operand = parseUnary();
      return { type: 'UnaryMinus', operand };
    }
    return parsePrimary();
  }

  // Primary → NUMBER | CELL_REF | '(' Expression ')'
  function parsePrimary() {
    const token = peek();

    if (token.type === TokenType.NUMBER) {
      consume();
      return { type: 'Number', value: parseFloat(token.value) };
    }

    if (token.type === TokenType.CELL_REF) {
      consume();
      return { type: 'CellRef', ref: token.value };
    }

    if (token.type === TokenType.LPAREN) {
      consume(TokenType.LPAREN);
      const expr = parseExpression();
      consume(TokenType.RPAREN);
      return expr;
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value})`);
  }

  const ast = parseExpression();

  // Ensure the entire input was consumed
  if (peek().type !== TokenType.EOF) {
    throw new Error(`Unexpected token after expression: ${peek().type}`);
  }

  return ast;
}

// ── AST Evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluate an AST node tree.
 * @param {object}   node        - AST node
 * @param {function} getCellValue - (cellId: string) => number | string
 *   Must return the *evaluated* numeric value of a cell, or throw / return NaN
 *   for cells that have errors.
 * @returns {number} The computed numeric result.
 */
function evaluateAST(node, getCellValue) {
  switch (node.type) {
    case 'Number':
      return node.value;

    case 'CellRef': {
      const val = getCellValue(node.ref);
      // Treat empty / blank cells as 0 (standard spreadsheet behaviour)
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      if (isNaN(num)) {
        throw new Error(`Cell ${node.ref} is not numeric`);
      }
      return num;
    }

    case 'UnaryMinus':
      return -evaluateAST(node.operand, getCellValue);

    case 'BinaryOp': {
      const l = evaluateAST(node.left, getCellValue);
      const r = evaluateAST(node.right, getCellValue);
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/':
          if (r === 0) throw new Error('Division by zero');
          return l / r;
        default:
          throw new Error(`Unknown operator: ${node.op}`);
      }
    }

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

// ── Dependency extraction ────────────────────────────────────────────────────

/**
 * Walk an AST and collect all cell-reference identifiers it contains.
 * @returns {string[]} e.g. ['A1', 'B2']
 */
function extractRefs(node) {
  if (!node) return [];
  switch (node.type) {
    case 'Number':
      return [];
    case 'CellRef':
      return [node.ref];
    case 'UnaryMinus':
      return extractRefs(node.operand);
    case 'BinaryOp':
      return [...extractRefs(node.left), ...extractRefs(node.right)];
    default:
      return [];
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a formula string (without leading "=") and return
 * { ast, refs } where refs is the list of cell ids referenced.
 * Throws on syntax errors.
 */
export function parseFormula(formulaBody) {
  const tokens = tokenize(formulaBody);
  const ast = parse(tokens);
  const refs = extractRefs(ast);
  return { ast, refs };
}

/**
 * Evaluate a previously-parsed AST.
 * @param {object}   ast          - from parseFormula
 * @param {function} getCellValue - (cellId) => number|string
 * @returns {number}
 */
export function evaluateFormula(ast, getCellValue) {
  return evaluateAST(ast, getCellValue);
}
