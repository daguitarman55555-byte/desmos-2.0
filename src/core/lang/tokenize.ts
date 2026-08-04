import { BUILTIN_NAMES, isBuiltinName, isConstantName } from './ast.ts';
import type { BuiltinName, ConstantName } from './ast.ts';
import { SourceError, span } from './errors.ts';
import type { Span } from './errors.ts';

export type OperatorChar = '+' | '-' | '*' | '/' | '^' | '(' | ')' | ',' | '=';

const OPERATOR_CHARS = '+-*/^(),=';

export type Token =
  | { readonly kind: 'number';   readonly value: number;       readonly span: Span }
  | { readonly kind: 'builtin';  readonly name: BuiltinName;   readonly span: Span }
  | { readonly kind: 'constant'; readonly name: ConstantName;  readonly span: Span }
  | { readonly kind: 'variable'; readonly name: string;        readonly span: Span }
  | { readonly kind: 'operator'; readonly op: OperatorChar;    readonly span: Span };

const isDigit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';
const isLetter = (c: string | undefined): boolean => c !== undefined && /[A-Za-zα-ωΑ-Ω]/.test(c);

/**
 * Split a run of letters into tokens by repeated longest match against the built-in and
 * constant names, falling back to single-character variables.
 *
 * Two consequences worth stating, because both are load-bearing and neither is obvious:
 *
 *  - The match loop stops at length two, so **no single-character name is ever matched as a
 *    built-in or constant here**. `e` is special-cased in the fallback below; `π` is not, and
 *    so becomes a variable (see the note on CONSTANT_VALUES in ast.ts).
 *  - Variables are therefore always exactly one character. `ab` is `a*b`, never a variable
 *    named "ab". Implicit multiplication in the parser is what makes that read correctly.
 *
 * Matching is case-insensitive for names but the fallback preserves case, so `SIN` is the sine
 * function while `A` and `a` are different variables.
 */
function tokenizeWord(word: string, wordStart: number, out: Token[]): void {
  let p = 0;
  while (p < word.length) {
    let matched: { name: string; length: number } | null = null;

    for (let length = word.length - p; length >= 2; length--) {
      const candidate = word.slice(p, p + length).toLowerCase();
      if (BUILTIN_NAMES.has(candidate) || isConstantName(candidate)) {
        matched = { name: candidate, length };
        break;
      }
    }

    if (matched) {
      const s = span(wordStart + p, wordStart + p + matched.length);
      if (isBuiltinName(matched.name)) out.push({ kind: 'builtin', name: matched.name, span: s });
      else if (isConstantName(matched.name)) out.push({ kind: 'constant', name: matched.name, span: s });
      p += matched.length;
      continue;
    }

    const ch = word[p] as string;
    const s = span(wordStart + p, wordStart + p + 1);
    // `e` is Euler's number, always. There is deliberately no way to name a variable `e`.
    if (ch === 'e') out.push({ kind: 'constant', name: 'e', span: s });
    else out.push({ kind: 'variable', name: ch, span: s });
    p++;
  }
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i] as string;

    if (c === ' ') {
      i++;
      continue;
    }

    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i;
      while (j < src.length && (isDigit(src[j]) || src[j] === '.')) j++;
      // parseFloat, not Number: "1.2.3" takes the leading valid prefix rather than becoming NaN.
      tokens.push({ kind: 'number', value: parseFloat(src.slice(i, j)), span: span(i, j) });
      i = j;
      continue;
    }

    if (isLetter(c)) {
      let j = i;
      while (j < src.length && isLetter(src[j])) j++;
      tokenizeWord(src.slice(i, j), i, tokens);
      i = j;
      continue;
    }

    if (OPERATOR_CHARS.includes(c)) {
      tokens.push({ kind: 'operator', op: c as OperatorChar, span: span(i, i + 1) });
      i++;
      continue;
    }

    throw new SourceError('unexpected-char', `Unexpected character ${JSON.stringify(c)}`, span(i, i + 1));
  }

  return tokens;
}

/** True when `t` is the given operator — the parser's workhorse predicate. */
export const isOperator = (t: Token | undefined, op: OperatorChar): boolean =>
  t !== undefined && t.kind === 'operator' && t.op === op;
