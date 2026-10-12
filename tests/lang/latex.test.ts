import { describe, expect, it } from 'vitest';
import { latexToSource, readGroup } from '../../src/core/lang/latex.ts';

describe('readGroup', () => {
  it('reads a balanced group and reports the index past it', () => {
    expect(readGroup('{abc}rest', 0)).toEqual(['abc', 5]);
  });

  it('handles nesting', () => {
    expect(readGroup('{a{b}c}x', 0)).toEqual(['a{b}c', 7]);
  });

  it('runs to the end rather than throwing on an unbalanced group', () => {
    // Half-typed input is the normal case while the user is still typing.
    expect(readGroup('{abc', 0)).toEqual(['abc', 4]);
  });
});

describe('latexToSource', () => {
  it('strips \\left and \\right delimiters', () => {
    expect(latexToSource('\\left(x+1\\right)')).toBe('(x+1)');
  });

  it('converts fractions to fully bracketed division', () => {
    // The brackets matter: without them, 1/2+x would reassociate.
    expect(latexToSource('\\frac{1}{2}')).toBe('((1)/(2))');
    expect(latexToSource('\\frac{x+1}{x-1}')).toBe('((x+1)/(x-1))');
  });

  it('converts square roots and nth roots', () => {
    expect(latexToSource('\\sqrt{x}')).toBe('sqrt(x)');
    expect(latexToSource('\\sqrt[3]{x}')).toBe('((x)^(1/(3)))');
  });

  it('brackets braced exponents', () => {
    expect(latexToSource('x^{2}')).toBe('x^(2)');
    expect(latexToSource('x^{n+1}')).toBe('x^(n+1)');
  });

  it('unwraps \\operatorname, which is how MathQuill emits function names', () => {
    expect(latexToSource('\\operatorname{sin}\\left(x\\right)')).toBe('sin(x)');
  });

  it('maps the named constants MathQuill produces', () => {
    expect(latexToSource('\\pi')).toBe('pi');
    expect(latexToSource('\\tau')).toBe('tau');
    expect(latexToSource('2\\pi')).toBe('2pi');
  });

  it('normalises multiplication and division commands', () => {
    // The trailing space MathQuill puts after \cdot survives the substitution; the tokenizer
    // skips whitespace, so it never reaches the parser.
    expect(latexToSource('2\\cdot 3')).toBe('2* 3');
    expect(latexToSource('2\\times3')).toBe('2*3');
    expect(latexToSource('6\\div2')).toBe('6/2');
  });

  it('drops the backslash from an unknown command and keeps its letters', () => {
    // This is why \gamma becomes a product of single-letter variables rather than an error.
    expect(latexToSource('\\gamma')).toBe('gamma');
  });

  it('recurses into fraction contents', () => {
    expect(latexToSource('\\frac{\\sqrt{x}}{\\pi}')).toBe('((sqrt(x))/(pi))');
  });



  it('preserves coefficient boundaries before TeX functions', () => {
    expect(latexToSource('y=a\\sin\\left(bx\\right)')).toBe('y=a*sin(bx)');
    expect(latexToSource('y=5x\\sin\\left(x\\right)')).toBe('y=5x*sin(x)');
    expect(latexToSource('y=a\\cos(x)+b\\tan(x)')).toBe('y=a*cos(x)+b*tan(x)');
    expect(latexToSource('y=a\\arcsin(x)')).toBe('y=a*arcsin(x)');
  });

  it('preserves a built-in written as a MathQuill operatorname', () => {
    expect(latexToSource('a\\operatorname{sin}\\left(x\\right)')).toBe('a*sin(x)');
    expect(latexToSource('\\operatorname{sin}\\left(x\\right)')).toBe('sin(x)');
    expect(latexToSource('a\\operatorname{mystery}')).toBe('amystery');
  });

  it('preserves coefficients inside recursively parsed fractions', () => {
    expect(latexToSource('\\frac{a\\sin(x)}{2}')).toBe('((a*sin(x))/(2))');
  });

  it('handles a realistic MathQuill payload end to end', () => {
    const tex = '\\frac{\\operatorname{sin}\\left(x\\right)}{x^{2}+1}';
    expect(latexToSource(tex)).toBe('((sin(x))/(x^(2)+1))');
  });
});
