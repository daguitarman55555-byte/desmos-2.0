// One row of the expression list.
//
// The row owns its DOM and its MathQuill field. It holds no document state — everything it
// renders arrives through `update`, and everything it changes goes out through callbacks. That
// separation is what lets the store be tested without a browser.

import { createMathField } from './MathField.ts';
import type { MathFieldHandle } from './MathField.ts';
import { createSlider } from './Slider.ts';
import type { SliderRow } from './Slider.ts';
import { curveIcon, deleteIcon, playIcon, swapIcon, warnIcon } from './icons.ts';
import { GRAPHED_KINDS } from '../core/lang/analyze.ts';
import type { Analysis } from '../core/lang/analyze.ts';
import type { Expression } from '../state/document.ts';

export interface RowCallbacks {
  onEdit(latex: string): void;
  onEnter(): void;
  onUp(): void;
  onDown(): void;
  onDeleteOutOfLeft(): void;
  onFocusRequest(): void;
  onToggleVisible(): void;
  onDelete(): void;
  onSliderValue(value: number): void;
  onSliderMin(value: number): void;
  onSliderMax(value: number): void;
  onSliderStep(value: string): void;
}

export interface RowView {
  readonly element: HTMLElement;
  readonly math: MathFieldHandle;
  update(index: number, expression: Expression, analysis: Analysis | undefined, focused: boolean): void;
}

/** Selectors that handle their own mousedown and must not steal focus to the math field. */
const SELF_HANDLED = '.sl-track, .bf, .expr-del, .idx-icon, .idx-icon2';

export function createRow(callbacks: RowCallbacks, leftDirection: number): RowView {
  const element = document.createElement('div');
  element.className = 'expr-row';

  const index = document.createElement('div');
  index.className = 'expr-index';
  const number = document.createElement('div');
  number.className = 'idx-num';
  const icon = document.createElement('div');
  icon.className = 'idx-icon';
  const icon2 = document.createElement('div');
  icon2.className = 'idx-icon2';
  index.append(number, icon, icon2);
  element.appendChild(index);

  const body = document.createElement('div');
  body.className = 'expr-body';
  const mathHost = document.createElement('div');
  mathHost.className = 'expr-math';
  body.appendChild(mathHost);

  const slider: SliderRow = createSlider({
    onValue: callbacks.onSliderValue,
    onMin: callbacks.onSliderMin,
    onMax: callbacks.onSliderMax,
    onStep: callbacks.onSliderStep,
  });
  body.append(slider.track, slider.bounds);
  element.appendChild(body);

  const remove = document.createElement('button');
  remove.className = 'expr-del';
  remove.innerHTML = deleteIcon;
  element.appendChild(remove);

  const math = createMathField(mathHost, {
    edit: (field) => callbacks.onEdit(field.latex()),
    enter: () => callbacks.onEnter(),
    upOutOf: () => callbacks.onUp(),
    downOutOf: () => callbacks.onDown(),
    deleteOutOf: (direction) => {
      if (direction === leftDirection) callbacks.onDeleteOutOfLeft();
    },
  });

  math.element.addEventListener('focusin', () => callbacks.onFocusRequest());

  icon.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    callbacks.onToggleVisible();
  });

  remove.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    callbacks.onDelete();
  });

  element.addEventListener('mousedown', (ev) => {
    if ((ev.target as HTMLElement).closest(SELF_HANDLED)) return;
    // Preventing default keeps the browser from moving focus before MathQuill can place the
    // caret, which is what makes clicking anywhere in the row land the cursor at the end.
    ev.preventDefault();
    callbacks.onFocusRequest();
  });

  return {
    element,
    math,

    update(position, expression, analysis, focused) {
      number.textContent = String(position + 1);
      element.classList.toggle('focused', focused);

      const hasContent = expression.latex.trim() !== '';
      remove.classList.toggle('show', hasContent);

      const kind = analysis?.kind ?? null;
      const errored = analysis?.error ?? false;

      const isVariableDefinition = kind === 'slider';
      const isGraphed = kind !== null && GRAPHED_KINDS.has(kind) && hasContent && !errored;
      const hasSlider = hasContent && !errored && !!analysis?.sliderKind;
      const showError = hasContent && errored;

      icon.classList.toggle('show', isGraphed || isVariableDefinition || showError);
      icon2.classList.toggle('show', isVariableDefinition);

      if (showError) {
        icon.innerHTML = warnIcon();
      } else if (isVariableDefinition) {
        // On a focused row the index cell turns blue, so the glyphs invert to stay legible.
        icon.innerHTML = playIcon(focused);
        icon2.innerHTML = swapIcon(focused);
      } else if (isGraphed) {
        icon.innerHTML = curveIcon(expression.colour ?? '#000', expression.visible);
      }

      slider.update({
        visible: hasSlider,
        focused,
        min: expression.min,
        max: expression.max,
        value: expression.val,
        label: analysis?.sliderLabel ?? '',
      });
    },
  };
}
