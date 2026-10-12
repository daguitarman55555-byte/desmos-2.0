import { BUILTIN_NAMES } from './ast.ts';

// LaTeX <-> plain source, both directions.
//
// MathQuill owns the LaTeX; everything below this line works on plain source. The conversion is
// deliberately lossy and shallow — it handles the constructs MathQuill actually emits for the
// input the calculator accepts, and lets anything else fall through as literal characters, where
// the tokenizer will reject it and the row gets a warning triangle.
// Built-in function commands preserve lexical boundaries when next to coefficients.

/**
 * Read a brace group starting at `i`, which must index a `{`.
 * Returns the group's contents and the index just past its closing brace.
 * An unbalanced group runs to the end of the string rather than throwing — a half-typed
 * expression is the normal case, not an error case.
 */
export function readGroup(s: string, i: number): readonly [string, number] {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}') {
      depth--;
      if (!depth) return [s.slice(i + 1, j), j + 1];
    }
  }
  return [s.slice(i + 1), s.length];
}

/**
 * Convert a MathQuill LaTeX string to plain source.
 *
 * The prefix replacements run once over the whole string; the loop then handles the constructs
 * that need balanced-group parsing. Recursive calls re-run the replacements on group contents,
 * which is harmless because every replacement is idempotent.
 *
 * Unknown commands lose their backslash and keep their letters, so `\gamma` becomes `gamma`,
 * which then tokenizes as a product of single-letter variables. That is the prototype's
 * behaviour and several quirks depend on it.
 */
export function latexToSource(tex: string): string {
  const s = tex
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\ /g, '')
    .replace(/\\operatorname\{([A-Za-z]+)\}/g, (_match, name: string) => '\\' + name)
    .replace(/\\pi/g, 'pi')
    .replace(/\\tau/g, 'tau')
    .replace(/\\theta/g, 'theta');

  let out = '';
  let i = 0;

  while (i < s.length) {
    if (s.startsWith('\\frac', i)) {
      const [numerator, afterNum] = readGroup(s, i + 5);
      const [denominator, afterDen] = readGroup(s, afterNum);
      out += '((' + latexToSource(numerator) + ')/(' + latexToSource(denominator) + '))';
      i = afterDen;
      continue;
    }

    if (s.startsWith('\\sqrt', i)) {
      const j = i + 5;
      if (s[j] === '[') {
        // \sqrt[n]{a} -> a^(1/n)
        const close = s.indexOf(']', j);
        const index = s.slice(j + 1, close);
        const [radicand, after] = readGroup(s, close + 1);
        out += '((' + latexToSource(radicand) + ')^(1/(' + latexToSource(index) + ')))';
        i = after;
        continue;
      }
      const [radicand, after] = readGroup(s, j);
      out += 'sqrt(' + latexToSource(radicand) + ')';
      i = after;
      continue;
    }

    if (s[i] === '^' && s[i + 1] === '{') {
      const [exponent, after] = readGroup(s, i + 1);
      out += '^(' + latexToSource(exponent) + ')';
      i = after;
      continue;
    }

    if (s[i] === '\\') {
      // Unknown command: drop the backslash, keep the letters.
      let j = i + 1;
      while (j < s.length && /[A-Za-z]/.test(s[j] as string)) j++;
      const command = s.slice(i + 1, j);
      // Preserve the boundary between a coefficient and a TeX function command.
      // Without it, a\\sin(x) collapses to asin(x), changing multiplication to arcsine.
      // Only known function commands need the separator; unknown-command behavior is unchanged.
      if (BUILTIN_NAMES.has(command.toLowerCase()) && /[A-Za-z0-9_)\]]$/.test(out)) {
        out += '*';
      }
      out += command;
      i = j;
      continue;
    }

    if (s[i] === '{' || s[i] === '}') {
      i++;
      continue;
    }

    out += s[i];
    i++;
  }

  return out;
}

/**
 * The source -> LaTeX direction, as far as milestone 1 needs it: turning a formatted coordinate
 * pair back into something MathQuill will render. `pi` is the only symbol `formatCoordinate`
 * can produce, and it produces at most one per number, so a single non-global replace suffices.
 */
export function coordinateToLatex(xText: string, yText: string): string {
  const esc = (t: string): string => t.replace('π', '\\pi ');
  return `\\left(${esc(xText)},${esc(yText)}\\right)`;
}
