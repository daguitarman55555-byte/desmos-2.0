// The on-screen keypad.
//
// Every number here was read off live desmos.com in an extension-free browser. Desmos builds its
// keypad into the DOM at load even while it is closed, so the layout could be measured without
// opening it: four rows of eleven units, each row 40px tall inside an 835px-wide well.
//
// The unit model is the thing worth knowing. A row is a flexbox of eleven equal units; an
// ordinary key takes one, the gaps between the three key groups take a half each, and four keys
// are wider — `functions` and `enter` take two, `backspace` takes one and a half. Every row's
// weights sum to exactly eleven, which is what keeps the columns aligned down the keypad. Those
// weights were derived from the measured widths (72.18px per unit against a 794px row), not
// guessed:
//
//   row 1   4 + ½ + 4 + ½ + 2      row 3   4 + ½ + 4 + 1 + 1½
//   row 2   4 + ½ + 4 + ½ + 1 + 1  row 4   4 + ½ + 4 + ½ + 2
//
// The keys carry Desmos's own `dcg-command` strings as their identity, so this table can be
// diffed against Desmos's DOM directly.
//
// Not wired, and deliberately so: `functions` and `ABC` open further panels that do not exist
// yet, and `Audio` is disabled in Desmos itself. All three render disabled rather than
// pretending to work — a dead key is worse than an obviously unavailable one.

import {
  arrowLeftIcon,
  arrowRightIcon,
  backspaceIcon,
  enterIcon,
  keypadChevronIcon,
  keypadIcon,
  radicalIcon,
  volumeIcon,
} from './icons.ts';
import { applyKeyAction } from './MathField.ts';
import type { KeyAction, MathField } from './MathField.ts';

/**
 * Desmos's three key finishes, from `.dcg-btn-*-on-gray`. Counterintuitively the *digits* are
 * the darker ones and the operators are white — check a screenshot before "fixing" it.
 */
export type KeyTheme = 'light' | 'dark' | 'blue';

/**
 * What a key is bound to.
 *
 * Two layers, and the distinction matters. Most keys edit the focused field and nothing else.
 * `enter` does not: it closes one row and opens the next, which is the document's business, not
 * MathQuill's. Sending it as a keystroke looks like it ought to work and silently does nothing —
 * MathQuill 0.10.1's public `keystroke('Enter')` never reaches its own `enter` handler.
 */
export type KeyBinding =
  | { readonly on: 'field'; readonly action: KeyAction }
  | { readonly on: 'document'; readonly action: DocumentAction };

/** Keypad actions the document owns rather than the focused field. */
export type DocumentAction = 'enter';

export interface Key {
  /** Desmos's own `dcg-command` value. The identity of the key, and its tooltip fallback. */
  readonly command: string;
  /** Face of the key, as markup. */
  readonly label: string;
  readonly theme: KeyTheme;
  /** Width in row units. Defaults to 1. */
  readonly units?: number;
  readonly title: string;
  /** Absent means the key is rendered disabled: nothing behind it yet. */
  readonly binding?: KeyBinding;
}

/** A gap between key groups. Half a unit wide unless stated. */
export interface Gap {
  readonly gap: number;
}

export type Cell = Key | Gap;

const isGap = (cell: Cell): cell is Gap => 'gap' in cell;

/** Shorthands for the maths faces, in the maths font Desmos sets them in. */
const v = (letter: string): string => `<i>${letter}</i>`;
const sup = (base: string, exponent: string): string => `${v(base)}<sup>${exponent}</sup>`;

const field = (action: KeyAction): KeyBinding => ({ on: 'field', action });
const type = (text: string): KeyBinding => field({ kind: 'type', text });
const cmd = (command: string): KeyBinding => field({ kind: 'cmd', command });
const write = (latex: string): KeyBinding => field({ kind: 'write', latex });
const key = (keys: string): KeyBinding => field({ kind: 'key', keys });
const sequence = (...steps: readonly KeyAction[]): KeyBinding => field({ kind: 'sequence', steps });

const digit = (d: string): Key => ({
  command: d,
  label: d,
  theme: 'dark',
  title: d,
  binding: type(d),
});

/**
 * The layout, exactly as Desmos orders it.
 *
 * `−` is typed as an ASCII hyphen even though it is drawn as U+2212, because that is what the
 * parser reads; the glyph difference is presentational only.
 */
export const KEYPAD_ROWS: readonly (readonly Cell[])[] = [
  [
    { command: 'boldX', label: v('x'), theme: 'light', title: 'x', binding: type('x') },
    { command: 'boldY', label: v('y'), theme: 'light', title: 'y', binding: type('y') },
    {
      command: 'a^2',
      label: sup('a', '2'),
      theme: 'light',
      title: 'Squared',
      // Superscript, a 2 inside it, then back out — so the caret lands after the exponent.
      binding: sequence({ kind: 'cmd', command: '^' }, { kind: 'type', text: '2' }, { kind: 'key', keys: 'Right' }),
    },
    { command: 'a^b', label: sup('a', 'b'), theme: 'light', title: 'Superscript', binding: cmd('^') },
    { gap: 0.5 },
    digit('7'),
    digit('8'),
    digit('9'),
    { command: '/', label: '÷', theme: 'light', title: 'Divide', binding: cmd('/') },
    { gap: 0.5 },
    { command: 'functions', label: 'functions', theme: 'dark', units: 2, title: 'Functions' },
  ],
  [
    { command: '(', label: '(', theme: 'light', title: 'Left Parenthesis', binding: cmd('(') },
    { command: ')', label: ')', theme: 'light', title: 'Right Parenthesis', binding: cmd(')') },
    { command: '<', label: '&lt;', theme: 'light', title: 'Less Than', binding: type('<') },
    { command: '>', label: '&gt;', theme: 'light', title: 'Greater Than', binding: type('>') },
    { gap: 0.5 },
    digit('4'),
    digit('5'),
    digit('6'),
    { command: '*', label: '×', theme: 'light', title: 'Times', binding: cmd('\\cdot') },
    { gap: 0.5 },
    { command: 'left', label: arrowLeftIcon, theme: 'dark', title: 'Left Arrow', binding: key('Left') },
    { command: 'right', label: arrowRightIcon, theme: 'dark', title: 'Right Arrow', binding: key('Right') },
  ],
  [
    { command: '|a|', label: `|${v('a')}|`, theme: 'light', title: 'Absolute Value', binding: cmd('|') },
    { command: ',', label: ',', theme: 'light', title: 'Comma', binding: type(',') },
    { command: '<=', label: '≤', theme: 'light', title: 'Less Than Or Equal', binding: write('\\le') },
    { command: '>=', label: '≥', theme: 'light', title: 'Greater Than Or Equal', binding: write('\\ge') },
    { gap: 0.5 },
    digit('1'),
    digit('2'),
    digit('3'),
    { command: '-', label: '−', theme: 'light', title: 'Minus', binding: type('-') },
    { gap: 1 },
    {
      command: 'backspace',
      label: backspaceIcon,
      theme: 'dark',
      units: 1.5,
      title: 'Backspace',
      binding: key('Backspace'),
    },
  ],
  [
    { command: 'ABC', label: 'A B C', theme: 'dark', title: 'Toggle Letters' },
    { command: 'Audio', label: volumeIcon, theme: 'dark', title: 'Toggle Audio Trace' },
    { command: 'sqrt', label: radicalIcon, theme: 'light', title: 'Square Root', binding: cmd('\\sqrt') },
    { command: 'pi', label: 'π', theme: 'light', title: 'Pi', binding: cmd('\\pi') },
    { gap: 0.5 },
    digit('0'),
    { command: '.', label: '.', theme: 'dark', title: 'Decimal', binding: type('.') },
    { command: '=', label: '=', theme: 'light', title: 'Equals', binding: type('=') },
    { command: '+', label: '+', theme: 'light', title: 'Plus', binding: type('+') },
    { gap: 0.5 },
    {
      command: 'enter',
      label: enterIcon,
      theme: 'blue',
      units: 2,
      title: 'Enter',
      binding: { on: 'document', action: 'enter' },
    },
  ],
];

export interface KeypadCallbacks {
  /** The field a press should go to, or null when nothing is focused. */
  focusedField(): MathField | null;
  /** A key the document owns rather than the focused field. */
  onDocumentAction(action: DocumentAction): void;
  /** Fired after the keypad opens or closes, so the layout can reflow around it. */
  onToggle(open: boolean): void;
}

export interface Keypad {
  readonly el: HTMLElement;
  readonly isOpen: boolean;
  toggle(): void;
  open(): void;
  close(): void;
}

export function createKeypad(callbacks: KeypadCallbacks): Keypad {
  const el = document.createElement('div');
  el.className = 'kp';
  el.hidden = true;

  const container = document.createElement('div');
  container.className = 'kp-container';
  const background = document.createElement('div');
  background.className = 'kp-bg';
  const keys = document.createElement('div');
  keys.className = 'kp-keys';
  const basic = document.createElement('div');
  basic.className = 'kp-basic';

  // The minimize tab rides above the top-left corner of the well, as Desmos does it.
  const minimiseHost = document.createElement('div');
  minimiseHost.className = 'kp-minimise-host';
  const minimise = document.createElement('button');
  minimise.type = 'button';
  minimise.className = 'kp-minimise';
  minimise.title = 'Hide Keypad';
  minimise.innerHTML = keypadIcon + `<span class="kp-caret kp-caret-down">${keypadChevronIcon}</span>`;
  minimiseHost.appendChild(minimise);

  const press = (binding: KeyBinding): void => {
    if (binding.on === 'document') {
      callbacks.onDocumentAction(binding.action);
      return;
    }
    const target = callbacks.focusedField();
    if (!target) return;
    applyKeyAction(target, binding.action);
  };

  for (const row of KEYPAD_ROWS) {
    const rowEl = document.createElement('div');
    rowEl.className = 'kp-row';

    for (const cell of row) {
      const slot = document.createElement('div');
      slot.className = 'kp-slot';
      slot.style.flexGrow = String(isGap(cell) ? cell.gap : cell.units ?? 1);

      if (!isGap(cell)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `kp-btn kp-btn-${cell.theme}`;
        button.title = cell.title;
        button.setAttribute('aria-label', cell.title);
        button.dataset['command'] = cell.command;

        const content = document.createElement('span');
        content.className = 'kp-btn-content';
        // Every label in KEYPAD_ROWS is a constant in this file — markup by design, never user
        // input — so the two comparison keys carry their angle brackets as entities.
        content.innerHTML = cell.label;
        button.appendChild(content);

        const { binding } = cell;
        if (binding) {
          // mousedown with the default prevented: the focused field must keep the caret, and a
          // click would blur it before the key could act.
          button.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            press(binding);
          });
        } else {
          slot.classList.add('kp-disabled');
          button.disabled = true;
        }

        slot.appendChild(button);
      }

      rowEl.appendChild(slot);
    }

    basic.appendChild(rowEl);
  }

  keys.append(minimiseHost, basic);
  background.appendChild(keys);
  container.appendChild(background);
  el.appendChild(container);

  let open = false;

  const setOpen = (next: boolean): void => {
    if (next === open) return;
    open = next;
    el.hidden = !next;
    callbacks.onToggle(next);
  };

  minimise.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    setOpen(false);
  });

  return {
    el,
    get isOpen() {
      return open;
    },
    toggle: () => setOpen(!open),
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}
