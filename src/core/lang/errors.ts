// Typed errors carrying source spans.
//
// CLAUDE.md's error philosophy splits these in two:
//
//   Numeric errors are silent.     1/0, sqrt(-1) in real mode, domain violations produce NaN,
//                                  the curve gets a gap, and nothing reaches the user. Those
//                                  never become a SourceError — they are just NaN.
//
//   Structural errors are visible. Unparseable input, expressions that cannot be plotted.
//                                  Those are the ones raised here, and they surface as the
//                                  warning triangle in the expression row's index cell.
//
// Every structural error records where in the source it came from, so a future editor can
// underline the offending characters rather than flagging the whole row.

/** Half-open character range into the plain-source form of an expression. */
export interface Span {
  readonly start: number;
  readonly end: number;
}

export const span = (start: number, end: number): Span => ({ start, end });

/** Span covering everything from the start of `a` to the end of `b`. */
export const spanning = (a: Span, b: Span): Span => ({ start: a.start, end: b.end });

export type ErrorCode =
  | 'unexpected-char'      // a character the tokenizer has no rule for
  | 'unexpected-eof'       // input ended mid-expression
  | 'unexpected-token'     // a token that cannot begin a primary
  | 'expected-token'       // a specific token was required here, e.g. a closing bracket
  | 'trailing-input'       // the expression parsed, but characters were left over
  | 'unsupported-node';    // the AST contains a node this backend cannot compile

export class SourceError extends Error {
  readonly code: ErrorCode;
  readonly span: Span | null;

  constructor(code: ErrorCode, message: string, span: Span | null = null) {
    super(message);
    this.name = 'SourceError';
    this.code = code;
    this.span = span;
  }
}

export const isSourceError = (e: unknown): e is SourceError => e instanceof SourceError;
