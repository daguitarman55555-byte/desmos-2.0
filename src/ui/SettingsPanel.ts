// The wrench.
//
// Built against live desmos.com measured in an extension-free browser: a 290px popover anchored
// to the left of the wrench button, 16px base font, 135.5x36 segmented-control buttons and
// 17.6px checkboxes.
//
// Deliberately NOT reproduced, because each needs an engine feature that does not exist yet
// rather than a control that does nothing:
//
//   Display size / Reverse contrast / Braille Mode — accessibility and theming. The palette
//     already lives in tokens.css, so a theme is a drop-in; these wait for it.
//   Complex Mode — needs core/numeric/complex.ts wired through the evaluator (UPGRADES P1).
//   More Options — its contents are the above.
//
// Everything here is live: each control drives something the renderer or the evaluator actually
// honours.

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

/** A labelled checkbox row. */
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

/** A two-option segmented control, as Desmos uses for angle mode and display size. */
function segmented<T extends string>(
  options: readonly [T, T],
  labels: readonly [string, string],
  onChange: (value: T) => void,
): { row: HTMLElement; select: (value: T) => void } {
  const row = document.createElement('div');
  row.className = 'set-segmented';
  const buttons = options.map((value, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'set-seg-btn';
    b.textContent = labels[i] as string;
    b.addEventListener('click', () => onChange(value));
    row.appendChild(b);
    return b;
  });
  return {
    row,
    select(value) {
      options.forEach((v, i) => buttons[i]?.classList.toggle('selected', v === value));
    },
  };
}

/** A number field that only reports finite values, so a half-typed "-" does not blank the view. */
function numberField(cls: string, onCommit: (value: number) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.className = `set-field ${cls}`;
  input.type = 'text';
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    if (isFinite(v)) onCommit(v);
  });
  return input;
}

export function createSettingsPanel(callbacks: SettingsPanelCallbacks): SettingsPanel {
  const element = document.createElement('div');
  element.className = 'popover set-panel';
  element.hidden = true;

  const heading = (text: string): HTMLElement => {
    const h = document.createElement('div');
    h.className = 'set-heading';
    h.textContent = text;
    return h;
  };

  // ── Grid group ────────────────────────────────────────────────────────────────────────────
  const grid = checkbox('Grid', false, (v) => callbacks.onChange({ showGrid: v }));
  const minor = checkbox('Minor Gridlines', false, (v) => callbacks.onChange({ showMinorGridlines: v }));
  const arrows = checkbox('Arrows', true, (v) => callbacks.onChange({ showArrows: v }));
  const numbers = checkbox('Axis Numbers', true, (v) => callbacks.onChange({ showAxisNumbers: v }));

  const gridGroup = document.createElement('div');
  gridGroup.className = 'set-grid-group';
  const gridLeft = document.createElement('div');
  gridLeft.append(grid.row, minor.row);
  const gridRight = document.createElement('div');
  gridRight.append(arrows.row, numbers.row);
  gridGroup.append(gridLeft, gridRight);

  // ── Axis groups ───────────────────────────────────────────────────────────────────────────
  function axisGroup(axis: 'x' | 'y') {
    const wrap = document.createElement('div');
    wrap.className = 'set-axis';
    wrap.appendChild(heading(`${axis.toUpperCase()}-Axis`));

    const labelRow = document.createElement('div');
    labelRow.className = 'set-row';
    const labelText = document.createElement('span');
    labelText.className = 'set-row-label';
    labelText.textContent = 'Label';
    const labelInput = document.createElement('input');
    labelInput.className = 'set-field set-axis-label';
    labelInput.type = 'text';
    labelInput.addEventListener('input', () =>
      callbacks.onChange(axis === 'x' ? { xAxisLabel: labelInput.value } : { yAxisLabel: labelInput.value }),
    );
    labelRow.append(labelText, labelInput);

    const rangeRow = document.createElement('div');
    rangeRow.className = 'set-row set-range';
    const min = numberField('set-min', (v) =>
      callbacks.onBoundsChange(axis === 'x' ? { xmin: v } : { ymin: v }),
    );
    const max = numberField('set-max', (v) =>
      callbacks.onBoundsChange(axis === 'x' ? { xmax: v } : { ymax: v }),
    );
    const le1 = document.createElement('span');
    le1.className = 'set-sym';
    le1.innerHTML = `&le;<i>${axis}</i>&le;`;
    rangeRow.append(min, le1, max);

    const stepRow = document.createElement('div');
    stepRow.className = 'set-row';
    const stepText = document.createElement('span');
    stepText.className = 'set-row-label';
    stepText.textContent = 'Step';
    const step = document.createElement('input');
    step.className = 'set-field set-step';
    step.type = 'text';
    step.addEventListener('input', () => {
      const v = parseFloat(step.value);
      // Empty or unparseable returns to the automatic 1-2-5 selection rather than erroring.
      const value = isFinite(v) && v > 0 ? v : null;
      callbacks.onChange(axis === 'x' ? { xAxisStep: value } : { yAxisStep: value });
    });
    stepRow.append(stepText, step);

    wrap.append(labelRow, rangeRow, stepRow);
    return { wrap, labelInput, min, max, step };
  }

  const xAxis = axisGroup('x');
  const yAxis = axisGroup('y');

  // ── Angle mode ────────────────────────────────────────────────────────────────────────────
  const angle = segmented<AngleMode>(
    ['radians', 'degrees'],
    ['Radians', 'Degrees'],
    (mode) => callbacks.onChange({ angleMode: mode }),
  );

  element.append(gridGroup, xAxis.wrap, yAxis.wrap, angle.row);

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
      // Minor gridlines and arrows are meaningless with the grid off, as in Desmos.
      minor.input.disabled = !values.showGrid;

      setIfNotFocused(xAxis.labelInput, values.xAxisLabel);
      setIfNotFocused(yAxis.labelInput, values.yAxisLabel);
      setIfNotFocused(xAxis.step, values.xAxisStep === null ? '' : String(values.xAxisStep));
      setIfNotFocused(yAxis.step, values.yAxisStep === null ? '' : String(values.yAxisStep));

      const round = (v: number): string => String(parseFloat(v.toPrecision(6)));
      setIfNotFocused(xAxis.min, round(bounds.xmin));
      setIfNotFocused(xAxis.max, round(bounds.xmax));
      setIfNotFocused(yAxis.min, round(bounds.ymin));
      setIfNotFocused(yAxis.max, round(bounds.ymax));

      angle.select(values.angleMode);
    },
  };
}
