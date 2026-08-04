// The slider track and the bounds editor beneath an expression.
//
// These are two views of the same thing and never both visible: the track shows when the row is
// unfocused, the bounds editor replaces it when the row has focus.

export interface SliderCallbacks {
  onValue(value: number): void;
  onMin(value: number): void;
  onMax(value: number): void;
  onStep(value: string): void;
}

export interface SliderState {
  readonly visible: boolean;
  readonly focused: boolean;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly label: string;
}

export interface SliderRow {
  readonly track: HTMLElement;
  readonly bounds: HTMLElement;
  update(state: SliderState): void;
}

/** Dragging quantises to two decimals, which is what keeps the latex readable. */
const VALUE_PRECISION = 100;

export function createSlider(callbacks: SliderCallbacks): SliderRow {
  const row = document.createElement('div');
  row.className = 'slider-row';

  const low = document.createElement('div');
  low.className = 'sl-lim';
  const track = document.createElement('div');
  track.className = 'sl-track';
  const tick = document.createElement('div');
  tick.className = 'sl-tick';
  const thumb = document.createElement('div');
  thumb.className = 'sl-thumb';
  track.append(tick, thumb);
  const high = document.createElement('div');
  high.className = 'sl-lim';
  row.append(low, track, high);

  const bounds = document.createElement('div');
  bounds.className = 'bounds-row';
  bounds.innerHTML =
    '<input class="bf bmin"><span class="bsym">&le;</span><span class="bsym bvar"></span>' +
    '<span class="bsym">&le;</span><input class="bf bmax">' +
    '<span class="bstep">Step:<input class="bf bstepf"></span>';

  let current: SliderState | null = null;

  const valueFromClientX = (clientX: number): number => {
    if (!current) return 0;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = current.min + fraction * (current.max - current.min);
    return Math.round(raw * VALUE_PRECISION) / VALUE_PRECISION;
  };

  // Window listeners are attached for the duration of a drag and removed on release. The
  // prototype added them permanently, once per row, and never took them off — harmless but it
  // leaked a pair of closures per expression.
  const onMove = (ev: MouseEvent): void => callbacks.onValue(valueFromClientX(ev.clientX));
  const onUp = (): void => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  track.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    callbacks.onValue(valueFromClientX(ev.clientX));
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  const minField = bounds.querySelector('.bmin') as HTMLInputElement;
  const maxField = bounds.querySelector('.bmax') as HTMLInputElement;
  const stepField = bounds.querySelector('.bstepf') as HTMLInputElement;
  const varLabel = bounds.querySelector('.bvar') as HTMLElement;

  minField.addEventListener('input', () => {
    const v = parseFloat(minField.value);
    if (isFinite(v)) callbacks.onMin(v);
  });
  maxField.addEventListener('input', () => {
    const v = parseFloat(maxField.value);
    if (isFinite(v)) callbacks.onMax(v);
  });
  stepField.addEventListener('input', () => callbacks.onStep(stepField.value));

  return {
    track: row,
    bounds,
    update(state) {
      current = state;
      row.classList.toggle('show', state.visible && !state.focused);
      bounds.classList.toggle('show', state.visible && state.focused);
      if (!state.visible) return;

      low.textContent = String(state.min);
      high.textContent = String(state.max);

      // Guard a zero-width range so the thumb parks at the left rather than reading NaN.
      const span = state.max - state.min || 1;
      const fraction = Math.max(0, Math.min(1, (state.value - state.min) / span));
      thumb.style.left = `${fraction * 100}%`;
      tick.style.left = `${((0 - state.min) / span) * 100}%`;
      varLabel.textContent = state.label;
    },
  };
}
