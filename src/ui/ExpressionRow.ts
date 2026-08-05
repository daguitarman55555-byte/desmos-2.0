// One row of the expression list.
//
// The row owns its DOM and its MathQuill field. It holds no document state — everything it
// renders arrives through `update`, and everything it changes goes out through callbacks. That
// separation is what lets the store be tested without a browser.

import { createMathField } from './MathField.ts';
import type { MathFieldHandle } from './MathField.ts';
import { createSlider } from './Slider.ts';
import type { SliderRow } from './Slider.ts';
import { curveIcon, deleteIcon, loopIcon, pauseIcon, playIcon, pointIcon, warnIcon } from './icons.ts';
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
  /** The same cell on a variable-definition row: start or stop the slider animation. */
  onTogglePlaying(): void;
  /** The second index-cell glyph: step to the next loop mode. */
  onCycleLoopMode(): void;
  /** Long press on the colour disc: open the style tray anchored to it. */
  onStyleMenu(anchor: HTMLElement): void;
  onDelete(): void;
  /** "add slider:" — define the named variables, in order, as new rows below this one. */
  onCreateSliders(names: readonly string[]): void;
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

/** How long the colour disc must be held before the style tray opens, in milliseconds. */
export const LONG_PRESS_MS = 400;

/**
 * Most individual variable buttons the "add slider:" prompt will show.
 *
 * Desmos's own cap, and the reason the "all" button exists: past four names the row would wrap
 * badly, so the rest are only reachable through "all".
 */
export const MAX_SLIDER_BUTTONS = 4;

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
  // "add slider: a b all", under the expression. Rebuilt only when the set of missing names
  // changes, so the buttons are not replaced under the cursor on every keystroke.
  const prompt = document.createElement('div');
  prompt.className = 'create-sliders';
  prompt.hidden = true;
  let promptNames = '';

  const renderPrompt = (names: readonly string[]): void => {
    const key = names.join(',');
    if (key === promptNames) return;
    promptNames = key;

    prompt.hidden = names.length === 0;
    prompt.innerHTML = '';
    if (!names.length) return;

    const msg = document.createElement('span');
    msg.className = 'cs-msg';
    msg.textContent = 'add slider:';
    prompt.appendChild(msg);

    const buttons = document.createElement('span');
    buttons.className = 'cs-btns';

    // A single missing variable gets the blue button itself; with more than one the individual
    // buttons go grey and "all" takes the blue. Desmos's rule, and it reads as "the obvious
    // thing to click" either way.
    const single = names.length === 1;
    const add = (label: string, latex: string, blue: boolean, all: boolean): void => {
      const holder = document.createElement('div');
      holder.className = all ? 'cs-btn-holder cs-all' : 'cs-btn-holder';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = blue ? 'cs-btn cs-btn-blue' : 'cs-btn cs-btn-grey';
      b.textContent = label;
      b.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        callbacks.onCreateSliders(latex === '' ? names : [latex]);
      });
      holder.appendChild(b);
      buttons.appendChild(holder);
    };

    for (const n of names.slice(0, MAX_SLIDER_BUTTONS)) add(n, n, single, false);
    if (!single) add('all', '', true, true);

    prompt.appendChild(buttons);
  };

  body.append(prompt, slider.track, slider.bounds);
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

  // Desmos puts two gestures on the disc: a click toggles visibility, a long press opens the
  // style tray. They share one element, so they are told apart by how long the button is held.
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let openedTray = false;
  // What the index cell currently *is*. On a variable-definition row the disc is the animation
  // control, not a visibility toggle, so the click has to be routed by kind and the kind is only
  // known at update time.
  let variableRow = false;

  const cancelPress = (): void => {
    if (pressTimer !== null) clearTimeout(pressTimer);
    pressTimer = null;
  };

  icon.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openedTray = false;
    pressTimer = setTimeout(() => {
      pressTimer = null;
      openedTray = true;
      callbacks.onStyleMenu(icon);
    }, LONG_PRESS_MS);
  });

  window.addEventListener('mouseup', () => {
    if (pressTimer !== null) {
      // Released before the tray opened, so this was a plain click.
      cancelPress();
      if (variableRow) callbacks.onTogglePlaying();
      else callbacks.onToggleVisible();
    }
    openedTray = false;
  });

  // The loop-mode glyph has no long press — one click, one step through the modes.
  icon2.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    callbacks.onCycleLoopMode();
  });

  icon.addEventListener('mouseleave', () => {
    if (!openedTray) cancelPress();
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
      variableRow = isVariableDefinition;
      const isGraphed = kind !== null && GRAPHED_KINDS.has(kind) && hasContent && !errored;
      const hasSlider = hasContent && !errored && !!analysis?.sliderKind;
      const showError = hasContent && errored;

      icon.classList.toggle('show', isGraphed || isVariableDefinition || showError);
      icon2.classList.toggle('show', isVariableDefinition);

      if (showError) {
        icon.innerHTML = warnIcon();
      } else if (isVariableDefinition) {
        // On a focused row the index cell turns blue, so the glyphs invert to stay legible.
        icon.innerHTML = expression.playing ? pauseIcon(focused) : playIcon(focused);
        icon2.innerHTML = loopIcon(expression.loopMode, focused);
      } else if (isGraphed) {
        // Desmos uses a different glyph per kind, and both track the expression's style.
        const colour = expression.colour ?? '#000';
        icon.innerHTML = kind === 'point'
          ? pointIcon(colour, expression.visible, expression.pointStyle)
          : curveIcon(colour, expression.visible, expression.lineStyle);
      }

      // Desmos offers sliders on any row it understands, error rows included only when the
      // error *is* the missing name — our analyser reports nothing for a broken row, so this
      // is simply "whatever it found".
      renderPrompt(analysis?.undefinedVariables ?? []);

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
