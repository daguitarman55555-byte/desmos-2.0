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
}

export interface SettingsPanel {
  readonly element: HTMLElement;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
  /** Push current values into the controls — called whenever the graph changes underneath. */
  update(values: SettingsValues, bounds: Bounds): void;
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

  const gridLeft = document.createElement('div');
  gridLeft.className = 'set-grid-left';
  gridLeft.append(grid.row, arrows.row);
  const gridRight = document.createElement('div');
  gridRight.className = 'set-grid-right';
  gridRight.append(numbers.row, minor.row);

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

    const commitBound = (which: 'min' | 'max') => (raw: string): void => {
      const v = parseFloat(raw);
      if (!isFinite(v)) return;                     // a half-typed "-" must not collapse the view
      if (isX) callbacks.onBoundsChange(which === 'min' ? { xmin: v } : { xmax: v });
      else callbacks.onBoundsChange(which === 'min' ? { ymin: v } : { ymax: v });
    };
    const min = textField('set-bound', '', commitBound('min'));
    const max = textField('set-bound', '', commitBound('max'));

    const sym = document.createElement('span');
    sym.className = 'set-sym';
    sym.innerHTML = `&le;<i>${axis}</i>&le;`;

    const step = textField('', '', (raw) => {
      const v = parseFloat(raw);
      // Empty or unparseable returns to the automatic 1-2-5 selection rather than erroring.
      const value = isFinite(v) && v > 0 ? v : null;
      callbacks.onChange(isX ? { xAxisStep: value } : { yAxisStep: value });
    });
    const stepWrap = document.createElement('span');
    stepWrap.className = 'set-step';
    const stepLabel = document.createElement('span');
    stepLabel.className = 'set-step-label';
    stepLabel.textContent = 'Step:';
    stepWrap.append(stepLabel, step);

    const range = document.createElement('div');
    range.className = 'set-range';
    range.append(min, sym, max, stepWrap);

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
    update(values, bounds) {
      grid.input.checked = values.showGrid;
      minor.input.checked = values.showMinorGridlines;
      arrows.input.checked = values.showArrows;
      numbers.input.checked = values.showAxisNumbers;
      // Minor gridlines are meaningless with the grid off, as in Desmos.
      minor.input.disabled = !values.showGrid;

      xAxis.visible.checked = values.showXAxis;
      yAxis.visible.checked = values.showYAxis;

      setIfNotFocused(xAxis.label, values.xAxisLabel);
      setIfNotFocused(yAxis.label, values.yAxisLabel);
      setIfNotFocused(xAxis.step, values.xAxisStep === null ? '' : String(values.xAxisStep));
      setIfNotFocused(yAxis.step, values.yAxisStep === null ? '' : String(values.yAxisStep));

      const round = (v: number): string => String(parseFloat(v.toPrecision(6)));
      setIfNotFocused(xAxis.min, round(bounds.xmin));
      setIfNotFocused(xAxis.max, round(bounds.xmax));
      setIfNotFocused(yAxis.min, round(bounds.ymin));
      setIfNotFocused(yAxis.max, round(bounds.ymax));

      for (const { mode, el } of angleButtons) el.classList.toggle('selected', mode === values.angleMode);
    },
  };
}
