// The wrench.
//
// Structure and every metric measured on live desmos.com in an extension-free browser: a 290px
// popover with a uniform 10px inset, sections fenced by a hairline rule, a two-column grid
// block, and per-axis rows of [minimum] <=x<= [maximum] [Step].
//
// Deliberately NOT reproduced, because each needs an engine feature that does not exist yet
// rather than a control that does nothing:
//
//   Display size / Reverse contrast / Braille Mode — accessibility and theming. The palette
//     already lives in tokens.css, so a theme is a drop-in; these wait for it.
//   Complex Mode — needs core/numeric/complex.ts wired through the evaluator (UPGRADES P1).
//   More Options — its contents are the above.
//   The grid-style icon row inside the Grid block — belongs with the expression colour and
//     line-style icons, which are a separate piece of work.
//
// Everything present is live: each control drives something the renderer or evaluator honours.
//
// The right-hand column's order is Desmos's, read off its `dcg-top-checkboxes-container`:
// Axis Numbers, Minor Gridlines, One Quadrant, then the Zoom Square button. Each of the last
// three is conditional — Minor Gridlines needs the grid on, and Zoom Square only appears while
// the axes are actually non-square, which is the only time it would do anything.

import { createMathField } from './MathField.ts';
import type { MathFieldHandle } from './MathField.ts';
import type { AngleMode } from '../core/lang/scope.ts';
import type { AxisOptions } from '../graph/axes.ts';

export interface SettingsValues extends AxisOptions {
  readonly angleMode: AngleMode;
}

/** Viewport bounds, which the panel edits directly rather than storing. */
export interface Bounds {
  readonly xmin: number;
  readonly xmax: number;
  readonly ymin: number;
  readonly ymax: number;
}

export interface SettingsPanelCallbacks {
  onChange(patch: Partial<SettingsValues>): void;
  onBoundsChange(patch: Partial<Bounds>): void;
  /** Make one maths unit the same length on both axes. */
  onZoomSquare(): void;
  /**
   * Evaluate a LaTeX fragment to a number, or NaN.
   *
   * Injected rather than imported so the panel stays clear of core/, and so the expression is
   * evaluated against the document's own scope — which is what lets a bound reference a slider
   * variable, not just a literal.
   */
  evaluateLatex(latex: string): number;
}

export interface SettingsPanel {
  readonly element: HTMLElement;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
  /**
   * Push current values into the controls — called whenever the graph changes underneath.
   *
   * `axesSquare` is not a setting, which is why it rides alongside rather than inside
   * `SettingsValues`: it is a fact about the viewport, and all it does is decide whether the
   * Zoom Square button has anything to offer.
   */
  update(values: SettingsValues, bounds: Bounds, axesSquare: boolean): void;
}

function section(...children: readonly HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'set-section';
  el.append(...children);
  return el;
}

/** A labelled checkbox. Small is Desmos's nested variant, used for the grid sub-options. */
function checkbox(
  label: string,
  small: boolean,
  onChange: (checked: boolean) => void,
): { row: HTMLElement; input: HTMLInputElement } {
  const row = document.createElement('label');
  row.className = small ? 'set-check set-check-sm' : 'set-check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.addEventListener('change', () => onChange(input.checked));
  const text = document.createElement('span');
  text.textContent = label;
  row.append(input, text);
  return { row, input };
}

/**
 * A MathQuill field that reports a number.
 *
 * Desmos's axis bounds and step are full math inputs — the screenshot that prompted this shows
 * `-e^3 <= y <= 4pi` and `Step: pi`. A plain number input cannot express that, so these are real
 * math fields and the value is whatever the document's evaluator makes of them.
 */
function mathField(
  cls: string,
  evaluate: (latex: string) => number,
  onValue: (value: number, latex: string) => void,
): { wrap: HTMLElement; handle: MathFieldHandle } {
  const wrap = document.createElement('div');
  wrap.className = `set-field set-mathfield ${cls}`;
  const handle = createMathField(wrap, {
    edit: (field) => {
      const latex = field.latex();
      onValue(evaluate(latex), latex);
    },
  });
  return { wrap, handle };
}

function textField(cls: string, placeholder: string, onInput: (value: string) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.className = `set-field ${cls}`;
  input.type = 'text';
  input.placeholder = placeholder;
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

export function createSettingsPanel(callbacks: SettingsPanelCallbacks): SettingsPanel {
  const element = document.createElement('div');
  element.className = 'popover set-panel';
  element.hidden = true;

  // ── Grid block: two columns ──────────────────────────────────────────────────────────────
  // The split is Desmos's, and it is not the obvious one: Grid and Arrows are full-size
  // controls in the left column, while Axis Numbers and Minor Gridlines are the smaller
  // 13.6px variant on the right. Pairing them any other way makes "Minor Gridlines" wrap.
  const grid = checkbox('Grid', false, (v) => callbacks.onChange({ showGrid: v }));
  const arrows = checkbox('Arrows', false, (v) => callbacks.onChange({ showArrows: v }));
  const numbers = checkbox('Axis Numbers', true, (v) => callbacks.onChange({ showAxisNumbers: v }));
  const minor = checkbox('Minor Gridlines', true, (v) => callbacks.onChange({ showMinorGridlines: v }));

  const quadrant = checkbox('One Quadrant', true, (v) =>
    callbacks.onChange({ restrictGridToFirstQuadrant: v }),
  );

  // A div, not a button: Desmos gives it role="button" and its own light-grey face, and it sits
  // in the checkbox column rather than in a row of its own.
  const zoomSquare = document.createElement('button');
  zoomSquare.type = 'button';
  zoomSquare.className = 'set-zoom-square';
  zoomSquare.textContent = 'Zoom Square';
  zoomSquare.addEventListener('click', () => callbacks.onZoomSquare());

  const gridLeft = document.createElement('div');
  gridLeft.className = 'set-grid-left';
  gridLeft.append(grid.row, arrows.row);
  const gridRight = document.createElement('div');
  gridRight.className = 'set-grid-right';
  gridRight.append(numbers.row, minor.row, quadrant.row, zoomSquare);

  const gridBlock = section(gridLeft, gridRight);
  gridBlock.classList.add('set-grid-group');

  // ── Axis blocks ──────────────────────────────────────────────────────────────────────────
  function axisBlock(axis: 'x' | 'y') {
    const isX = axis === 'x';

    // In Desmos the axis name is itself the visibility checkbox, with the label field beside it.
    const visible = checkbox(`${axis.toUpperCase()}-Axis`, false, (v) =>
      callbacks.onChange(isX ? { showXAxis: v } : { showYAxis: v }),
    );
    const label = textField('set-axis-label', 'Label', (v) =>
      callbacks.onChange(isX ? { xAxisLabel: v } : { yAxisLabel: v }),
    );
    const title = document.createElement('div');
    title.className = 'set-axis-title';
    title.append(visible.row, label);

    const commitBound = (which: 'min' | 'max') => (v: number): void => {
      if (!isFinite(v)) return;                     // a half-typed "-" must not collapse the view
      if (isX) callbacks.onBoundsChange(which === 'min' ? { xmin: v } : { xmax: v });
      else callbacks.onBoundsChange(which === 'min' ? { ymin: v } : { ymax: v });
    };
    const min = mathField('set-bound', callbacks.evaluateLatex, commitBound('min'));
    const max = mathField('set-bound', callbacks.evaluateLatex, commitBound('max'));

    const sym = document.createElement('span');
    sym.className = 'set-sym';
    sym.innerHTML = `&le;<i>${axis}</i>&le;`;

    const step = mathField('set-stepfield', callbacks.evaluateLatex, (v) => {
      // Empty or unparseable returns to the automatic 1-2-5 selection rather than erroring, so
      // clearing the field is how you go back to the 1-2-5 grid.
      const value = isFinite(v) && v > 0 ? v : null;
      callbacks.onChange(isX ? { xAxisStep: value } : { yAxisStep: value });
    });
    const stepWrap = document.createElement('span');
    stepWrap.className = 'set-step';
    const stepLabel = document.createElement('span');
    stepLabel.className = 'set-step-label';
    stepLabel.textContent = 'Step:';
    stepWrap.append(stepLabel, step.wrap);

    const range = document.createElement('div');
    range.className = 'set-range';
    range.append(min.wrap, sym, max.wrap, stepWrap);

    const block = section(title, range);
    block.classList.add('set-axis');
    return { block, visible: visible.input, label, min, max, step };
  }

  const xAxis = axisBlock('x');
  const yAxis = axisBlock('y');

  // ── Angle mode ───────────────────────────────────────────────────────────────────────────
  const segmented = document.createElement('div');
  segmented.className = 'set-segmented';
  const angleButtons: Array<{ mode: AngleMode; el: HTMLButtonElement }> = (
    [
      ['radians', 'Radians'],
      ['degrees', 'Degrees'],
    ] as ReadonlyArray<readonly [AngleMode, string]>
  ).map(([mode, text]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'set-seg-btn';
    b.textContent = text;
    b.addEventListener('click', () => callbacks.onChange({ angleMode: mode }));
    segmented.appendChild(b);
    return { mode, el: b };
  });

  element.append(gridBlock, xAxis.block, yAxis.block, section(segmented));

  let open = false;

  /** Editing a field must not fight the value being pushed back in on the same frame. */
  const setIfNotFocused = (input: HTMLInputElement, value: string): void => {
    if (document.activeElement !== input) input.value = value;
  };

  /** Same guard for a math field, whose focus lives on a textarea inside it. */
  const setMathIfNotFocused = (field: { wrap: HTMLElement; handle: MathFieldHandle }, latex: string): void => {
    if (field.wrap.contains(document.activeElement)) return;
    field.handle.setLatexQuietly(latex);
  };

  return {
    element,
    get isOpen() {
      return open;
    },
    open() {
      open = true;
      element.hidden = false;
    },
    close() {
      open = false;
      element.hidden = true;
    },
    toggle() {
      if (open) this.close();
      else this.open();
    },
    update(values, bounds, axesSquare) {
      grid.input.checked = values.showGrid;
      minor.input.checked = values.showMinorGridlines;
      arrows.input.checked = values.showArrows;
      numbers.input.checked = values.showAxisNumbers;
      quadrant.input.checked = values.restrictGridToFirstQuadrant;
      // Neither means anything with the grid off, and Desmos hides rather than disables them.
      minor.row.hidden = !values.showGrid;
      quadrant.row.hidden = !values.showGrid;
      // Nothing to square when the axes already are.
      zoomSquare.hidden = axesSquare;

      xAxis.visible.checked = values.showXAxis;
      yAxis.visible.checked = values.showYAxis;

      setIfNotFocused(xAxis.label, values.xAxisLabel);
      setIfNotFocused(yAxis.label, values.yAxisLabel);
      setMathIfNotFocused(xAxis.step, values.xAxisStep === null ? '' : String(values.xAxisStep));
      setMathIfNotFocused(yAxis.step, values.yAxisStep === null ? '' : String(values.yAxisStep));

      // Six significant figures, matching what Desmos shows for a panned viewport.
      const round = (v: number): string => String(parseFloat(v.toPrecision(6)));
      setMathIfNotFocused(xAxis.min, round(bounds.xmin));
      setMathIfNotFocused(xAxis.max, round(bounds.xmax));
      setMathIfNotFocused(yAxis.min, round(bounds.ymin));
      setMathIfNotFocused(yAxis.max, round(bounds.ymax));

      for (const { mode, el } of angleButtons) el.classList.toggle('selected', mode === values.angleMode);
    },
  };
}
