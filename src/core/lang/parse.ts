import { CONSTANT_VALUES } from './ast.ts';
import type { BinaryOp, Node } from './ast.ts';
import { SourceError, span, spanning } from './errors.ts';
import { isOperator, tokenize } from './tokenize.ts';
import type { OperatorChar, Token } from './tokenize.ts';

/**
 * Recursive descent, one function per precedence level:
 *
 *   expression := additive
 *   additive   := multiplicative (('+' | '-') multiplicative)*
 *   multiplicative := unary (('*' | '/') unary | <juxtaposition> unary)*
 *   unary      := ('-' | '+') unary | power
 *   power      := primary ('^' unary)?
 *   primary    := number | constant | variable ['(' args ')'] | builtin '(' args ')'
 *               | '(' expression (',' expression)* ')'
 *
 * Two shapes worth naming:
 *
 *  - **Juxtaposition is multiplication.** `2x`, `x y` and `2(x+1)` all parse as products. It sits
 *    at the same precedence as explicit `*`, so `1/2x` is `(1/2)*x`, not `1/(2x)`.
 *  - **Exponentiation takes a *unary* right operand**, which makes it right-associative and lets
 *    `2^-3` parse: `2^3^2` is `2^(3^2)`.
 */
export function parse(tokens: readonly Token[]): Node {
  let p = 0;

  const peek = (): Token | undefined => tokens[p];

  const eat = (op: OperatorChar): boolean => {
    if (isOperator(tokens[p], op)) {
      p++;
      return true;
    }
    return false;
  };

  /** Span for an error at the current position, or at the very end when input ran out. */
  const here = (): ReturnType<typeof span> => {
    const t = tokens[p];
    if (t) return t.span;
    const last = tokens[tokens.length - 1];
    return last ? span(last.span.end, last.span.end) : span(0, 0);
  };

  function expression(): Node {
    return additive();
  }

  function additive(): Node {
    let left = multiplicative();
    for (;;) {
      const t = peek();
      if (t === undefined || t.kind !== 'operator' || (t.op !== '+' && t.op !== '-')) break;
      p++;
      const right = multiplicative();
      left = { type: 'binary', op: t.op as BinaryOp, left, right, span: spanning(left.span, right.span) };
    }
    return left;
  }

  function multiplicative(): Node {
    let left = unary();
    for (;;) {
      const t = peek();
      if (t === undefined) break;

      if (t.kind === 'operator' && (t.op === '*' || t.op === '/')) {
        p++;
        const right = unary();
        left = { type: 'binary', op: t.op as BinaryOp, left, right, span: spanning(left.span, right.span) };
        continue;
      }

      // Juxtaposition: anything that can begin a primary, appearing where an operator could
      // have been, is an implicit product.
      const startsPrimary =
        t.kind === 'number' || t.kind === 'variable' || t.kind === 'constant' ||
        t.kind === 'builtin' || (t.kind === 'operator' && t.op === '(');

      if (!startsPrimary) break;

      const right = unary();
      left = { type: 'binary', op: '*', left, right, span: spanning(left.span, right.span) };
    }
    return left;
  }

  function unary(): Node {
    const t = peek();
    if (t !== undefined && t.kind === 'operator' && t.op === '-') {
      p++;
      const operand = unary();
      return { type: 'negate', operand, span: spanning(t.span, operand.span) };
    }
    if (t !== undefined && t.kind === 'operator' && t.op === '+') {
      p++;
      return unary();
    }
    return power();
  }

  function power(): Node {
    const base = primary();
    if (isOperator(peek(), '^')) {
      p++;
      const exponent = unary();
      return { type: 'binary', op: '^', left: base, right: exponent, span: spanning(base.span, exponent.span) };
    }
    return base;
  }

  /** Comma-separated arguments, the opening bracket already consumed. */
  function argumentList(): Node[] {
    const args = [expression()];
    while (eat(',')) args.push(expression());
    return args;
  }

  function primary(): Node {
    const t = peek();
    if (t === undefined) {
      throw new SourceError('unexpected-eof', 'Expression ended unexpectedly', here());
    }

    switch (t.kind) {
      case 'number':
        p++;
        return { type: 'number', value: t.value, span: t.span };

      // Constants fold to numbers during parsing, so they cannot be shadowed later.
      case 'constant':
        p++;
        return { type: 'number', value: CONSTANT_VALUES[t.name], span: t.span };

      case 'variable': {
        p++;
        if (isOperator(peek(), '(')) {
          p++;
          const args = argumentList();
          const close = peek();
          // Deliberately permissive: a user-function call with no closing bracket still parses,
          // which is what lets `f(x` behave while it is being typed.
          eat(')');
          return {
            type: 'userCall',
            name: t.name,
            args,
            span: spanning(t.span, close ? close.span : args[args.length - 1]!.span),
          };
        }
        return { type: 'variable', name: t.name, span: t.span };
      }

      case 'builtin': {
        p++;
        if (!eat('(')) {
          throw new SourceError('expected-token', `Expected "(" after ${t.name}`, here());
        }
        const args = argumentList();
        const closeSpan = here();
        if (!eat(')')) {
          throw new SourceError('expected-token', 'Expected ")"', closeSpan);
        }
        return { type: 'call', name: t.name, args, span: spanning(t.span, closeSpan) };
      }

      case 'operator': {
        if (t.op === '(') {
          p++;
          const items = argumentList();
          const closeSpan = here();
          if (!eat(')')) {
            throw new SourceError('expected-token', 'Expected ")"', closeSpan);
          }
          if (items.length === 1) return items[0]!;
          return { type: 'tuple', items, span: spanning(t.span, closeSpan) };
        }
        throw new SourceError('unexpected-token', `Unexpected "${t.op}"`, t.span);
      }

      default: {
        const never: never = t;
        return never;
      }
    }
  }

  const node = expression();
  if (p < tokens.length) {
    throw new SourceError('trailing-input', 'Unexpected trailing input', here());
  }
  return node;
}

/** Convenience: plain source straight to an AST. */
export const parseSource = (src: string): Node => parse(tokenize(src));
