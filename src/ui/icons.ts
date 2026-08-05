// Every SVG in the app, as markup strings.
//
// Kept verbatim from the prototype, including the fractional stroke widths and path coordinates
// — these were traced against Desmos captures and small changes are visible at 100% zoom.

import { dashPattern } from '../state/document.ts';
import type { LineStyle, LoopMode, PointStyle } from '../state/document.ts';

export const openGraphIcon = `
<svg width="20" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2.6 18.6V5.4A1.4 1.4 0 0 1 4 4h4.4l1.9 2.2H15.8a1.4 1.4 0 0 1 1.4 1.4v1.5"/>
  <path d="M2.6 18.6l2.9-8.1A1.2 1.2 0 0 1 6.6 9.7H21a.9.9 0 0 1 .86 1.2l-2.6 7.7z"/>
</svg>`;

export const shareIcon = `
<svg width="19.2" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 10.5H5.6A1.6 1.6 0 0 0 4 12.1v6.3A1.6 1.6 0 0 0 5.6 20h12.8a1.6 1.6 0 0 0 1.6-1.6v-6.3a1.6 1.6 0 0 0-1.6-1.6H16"/>
  <path d="M12 14.6V4"/><path d="M8.3 7.5L12 3.8l3.7 3.7"/>
</svg>`;

export const helpIcon = `
<svg width="19.2" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9.1"/>
  <path d="M9.3 9.3a2.75 2.75 0 1 1 3.45 2.65c-.62.19-.83.7-.83 1.33v.55"/>
  <circle cx="11.95" cy="16.9" r="1.05" fill="#fff" stroke="none"/>
</svg>`;

export const languageIcon = `
<svg width="19.2" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9.1"/><path d="M2.9 12h18.2"/>
  <path d="M12 2.9c2.5 2.55 3.85 5.75 3.85 9.1S14.5 18.55 12 21.1c-2.5-2.55-3.85-5.75-3.85-9.1S9.5 5.45 12 2.9z"/>
</svg>`;

export const desmosMarkIcon = `
<svg width="25.6" height="32" viewBox="0 0 32 32" fill="none">
  <path d="M7 8.5c0 10.2 3.7 15.5 9 15.5s9-5.3 9-15.5" stroke="#3ec415" stroke-width="3.6" stroke-linecap="round"/>
</svg>`;

export const addIcon = `
<svg width="22.4" height="28" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M12 4.6v14.8M4.6 12h14.8"/></svg>`;

export const undoIcon = `
<svg width="21.6" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.2 8.6h10.6a5.4 5.4 0 1 1 0 10.8H9.2"/><path d="M8.1 4.7L4.2 8.6l3.9 3.9"/>
</svg>`;

export const redoIcon = `
<svg width="21.6" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19.8 8.6H9.2a5.4 5.4 0 1 0 0 10.8h5.6"/><path d="M15.9 4.7l3.9 3.9-3.9 3.9"/>
</svg>`;

export const settingsIcon = `
<svg width="20.8" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55">
  <circle cx="12" cy="12" r="3.1"/>
  <path d="M19.1 14.7a1.55 1.55 0 0 0 .31 1.71l.06.06a1.85 1.85 0 1 1-2.62 2.62l-.05-.06a1.55 1.55 0 0 0-1.72-.31 1.55 1.55 0 0 0-.94 1.42v.16a1.85 1.85 0 1 1-3.7 0v-.09a1.55 1.55 0 0 0-1.02-1.42 1.55 1.55 0 0 0-1.71.31l-.06.06a1.85 1.85 0 1 1-2.62-2.62l.06-.06a1.55 1.55 0 0 0 .31-1.71 1.55 1.55 0 0 0-1.42-.94H3.7a1.85 1.85 0 1 1 0-3.7h.09a1.55 1.55 0 0 0 1.42-1.02 1.55 1.55 0 0 0-.31-1.71l-.06-.06A1.85 1.85 0 1 1 7.46 4.8l.06.06a1.55 1.55 0 0 0 1.71.31h.08a1.55 1.55 0 0 0 .94-1.42V3.7a1.85 1.85 0 1 1 3.7 0v.09a1.55 1.55 0 0 0 .94 1.42 1.55 1.55 0 0 0 1.72-.31l.05-.06a1.85 1.85 0 1 1 2.62 2.62l-.06.06a1.55 1.55 0 0 0-.31 1.71v.08a1.55 1.55 0 0 0 1.42.94h.16a1.85 1.85 0 1 1 0 3.7h-.09a1.55 1.55 0 0 0-1.4.75z"/>
</svg>`;

export const collapseIcon = `
<svg width="21.6" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M13.2 5.6L6.8 12l6.4 6.4"/><path d="M18.6 5.6L12.2 12l6.4 6.4"/>
</svg>`;

export const keypadIcon = `
<svg width="21.6" height="19" viewBox="0 0 27 19" fill="none" stroke="#3f3f3f" stroke-width="1.25">
  <rect x="0.9" y="0.9" width="25.2" height="17.2" rx="2.2"/>
  <path d="M4.2 5.4h1.7M8.2 5.4h1.7M12.2 5.4h1.7M16.2 5.4h1.7M20.2 5.4h1.7M4.2 9.4h1.7M8.2 9.4h1.7M12.2 9.4h1.7M16.2 9.4h1.7M20.2 9.4h1.7M8 13.4h11" stroke-linecap="round"/>
</svg>`;

export const keypadChevronIcon = `
<svg width="11.2" height="9" viewBox="0 0 14 9" fill="none" stroke="#3f3f3f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 6.9L7 1.9l5.4 5"/></svg>`;

// ── Keypad glyphs ────────────────────────────────────────────────────────────────────────────
//
// Four of Desmos's keys carry an icon rather than a maths label: the two caret arrows, the
// backspace and the enter. Drawn at the weights its icon font renders them.

export const arrowLeftIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>`;

export const arrowRightIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>`;

/** Backspace: the tag-shaped key with a cross in it. */
export const backspaceIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.4 5.2h11.1a1.6 1.6 0 0 1 1.6 1.6v10.4a1.6 1.6 0 0 1-1.6 1.6H8.4L2.5 12z"/>
  <path d="M15.9 9.4l-4.8 5.2M11.1 9.4l4.8 5.2"/>
</svg>`;

/** Enter: the hooked arrow returning to the left. */
export const enterIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 5.5v6.9a2 2 0 0 1-2 2H4.6"/><path d="M8.9 10.2L4.4 14.4l4.5 4.2"/>
</svg>`;

export const volumeIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.5 4.5L6.6 8.6H3v6.8h3.6l4.9 4.1z"/><path d="M15.4 9a4.2 4.2 0 0 1 0 6"/>
</svg>`;

/** The radical the √ key shows, matching MathQuill's own prefix shape. */
export const radicalIcon = `
<svg viewBox="0 0 32 30" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 16.5l4-3.3 3.4 12.2L18 4h13"/>
</svg>`;

export const toastMarkIcon = `
<svg width="38.4" height="38" viewBox="0 0 48 38" fill="none" style="flex:0 0 48px">
  <path d="M7 5c0 16.5 7.4 27 17 27s17-10.5 17-27" stroke="#232323" stroke-width="5.6" stroke-linecap="round"/>
</svg>`;

export const closeIcon = `
<svg width="13.6" height="17" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" fill="none"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

export const deleteIcon = `
<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

export const wrenchIcon = `
<svg width="18.4" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 6.6a4.1 4.1 0 0 0 5.3 5.3l-8.4 8.4a2.45 2.45 0 1 1-3.5-3.5z"/>
  <path d="M15 6.6L17.4 4a4.1 4.1 0 0 1 2.9 7.9"/>
</svg>`;

export const zoomInIcon = `
<svg width="18.4" height="23" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"><path d="M12 5v14M5 12h14"/></svg>`;

export const zoomOutIcon = `
<svg width="18.4" height="23" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"><path d="M5 12h14"/></svg>`;

export const homeIcon = `
<svg width="18.4" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.4 10.4L12 3.4l8.6 7"/><path d="M5.6 9.1v10.3h12.8V9.1"/><path d="M9.9 19.4v-5.6h4.2v5.6"/>
</svg>`;

export const exportPointIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1.5-1.5H11"/>
  <path d="M15 3.6h5.4V9"/><path d="M20.4 3.6L11.4 12.6"/>
</svg>`;

// ── Expression icons ─────────────────────────────────────────────────────────────────────────
//
// Desmos renders these as a 29px disc filled with the expression colour, no border, carrying a
// white glyph from a private icon font (`dcg-icon-parametric-solid`, `dcg-icon-point-closed`).
// The font is not ours to use, so the glyphs are redrawn as SVG at the same weights.
//
// The glyph name is the tell that the icon tracks line style: there is a `-solid` variant, so
// there are dashed and dotted ones too. `curveIcon` dashes the wave to match the curve.


/** Disc diameter in css pixels, measured on live desmos.com. */
export const ICON_DISC_SIZE = 29;

/** Stroke weight of the wave inside the 30-unit icon viewBox. */
const WAVE_WIDTH = 2.8;

/** Hidden expressions invert: white disc, coloured glyph, grey ring. */
const HIDDEN_RING = '#c4c4c4';

const dashAttr = (style: LineStyle): string => {
  const pattern = dashPattern(style, WAVE_WIDTH);
  return pattern.length ? ` stroke-dasharray="${pattern.join(' ')}"` : '';
};

/**
 * The visibility toggle in the index cell, for anything drawn as a curve.
 *
 * Desmos fills the disc with the expression colour and knocks the wave out in white. Hidden
 * expressions invert it: white disc, coloured wave and a grey ring so the disc still reads as a
 * disc against the white row.
 */
export function curveIcon(colour: string, visible: boolean, lineStyle: LineStyle = 'SOLID'): string {
  const disc = visible
    ? `<circle cx="15" cy="15" r="15" fill="${colour}"/>`
    : `<circle cx="15" cy="15" r="14.3" fill="#fff" stroke="${HIDDEN_RING}" stroke-width="1.4"/>`;
  return `<svg viewBox="0 0 30 30" width="100%" height="100%">
    ${disc}
    <path d="M5 20.2c2.1-10.6 4.9-10.6 7 0s4.9 10.6 7 0 4.6-9.6 5.9-4.4"
      fill="none" stroke="${visible ? '#fff' : colour}" stroke-width="${WAVE_WIDTH}"
      stroke-linecap="round" stroke-linejoin="round"${dashAttr(lineStyle)}/>
  </svg>`;
}

/** The marker glyphs, drawn white-on-colour inside the disc. Sized to Desmos's 19.25px glyph. */
function markerPath(style: PointStyle, ink: string, r = 6.2, w = 2.4): string {
  const c = 15;
  const poly = (n: number, radius: number, rotate = -Math.PI / 2): string =>
    Array.from({ length: n }, (_, i) => {
      const a = rotate + (i * 2 * Math.PI) / n;
      return `${(c + radius * Math.cos(a)).toFixed(2)},${(c + radius * Math.sin(a)).toFixed(2)}`;
    }).join(' ');

  switch (style) {
    case 'POINT':
      return `<circle cx="${c}" cy="${c}" r="${r}" fill="${ink}"/>`;
    case 'OPEN':
      return `<circle cx="${c}" cy="${c}" r="${r - w / 2}" fill="none" stroke="${ink}" stroke-width="${w}"/>`;
    case 'CROSS':
      return `<path d="M${c - r},${c - r}L${c + r},${c + r}M${c + r},${c - r}L${c - r},${c + r}"
        stroke="${ink}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    case 'PLUS':
      return `<path d="M${c - r},${c}L${c + r},${c}M${c},${c - r}L${c},${c + r}"
        stroke="${ink}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    case 'SQUARE':
      return `<rect x="${c - r * 0.9}" y="${c - r * 0.9}" width="${r * 1.8}" height="${r * 1.8}" fill="${ink}"/>`;
    case 'DIAMOND':
      return `<polygon points="${poly(4, r * 1.15)}" fill="${ink}"/>`;
    case 'TRIANGLE':
      return `<polygon points="${poly(3, r * 1.2)}" fill="${ink}"/>`;
    case 'STAR': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const radius = i % 2 === 0 ? r * 1.2 : r * 0.48;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        return `${(c + radius * Math.cos(a)).toFixed(2)},${(c + radius * Math.sin(a)).toFixed(2)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${ink}"/>`;
    }
    default: {
      const never: never = style;
      return never;
    }
  }
}

/** The visibility toggle for a point expression. */
export function pointIcon(colour: string, visible: boolean, pointStyle: PointStyle = 'POINT'): string {
  const disc = visible
    ? `<circle cx="15" cy="15" r="15" fill="${colour}"/>`
    : `<circle cx="15" cy="15" r="14.3" fill="#fff" stroke="${HIDDEN_RING}" stroke-width="1.4"/>`;
  return `<svg viewBox="0 0 30 30" width="100%" height="100%">
    ${disc}
    ${markerPath(pointStyle, visible ? '#fff' : colour)}
  </svg>`;
}

// ── Style tray glyphs ────────────────────────────────────────────────────────────────────────
//
// Measured off Desmos's own stylesheet rather than guessed. Three corrections to what the tray
// used to draw:
//
//  - a colour tile is a 30px rounded *square* filled with the colour, not a disc, and the
//    selected one is marked by a white tick laid over it rather than by a ring;
//  - the line-style and point-style previews are not drawn in the expression's colour. They are
//    grey (#949494) and turn the accent blue when selected, so both glyphs use `currentColor`
//    and let the stylesheet decide.

/** The tick laid over the selected colour tile. White; Desmos darkens it only on pale colours. */
export const checkIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.6 4.6L19 7.7"/></svg>`;

/** A line-style preview: a short rule carrying that style's dash pattern. */
export const lineStyleGlyph = (style: LineStyle): string => {
  const pattern = dashPattern(style, 2.6);
  return `<svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M2 12H22" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
      ${pattern.length ? `stroke-dasharray="${pattern.join(' ')}"` : ''}/>
  </svg>`;
};

/** A point-style preview: the bare marker, no disc behind it. */
export const pointStyleGlyph = (style: PointStyle): string =>
  `<svg viewBox="0 0 30 30" width="100%" height="100%">${markerPath(style, 'currentColor', 9.5, 2.8)}</svg>`;

// ── Tray field icons ─────────────────────────────────────────────────────────────────────────
//
// Desmos labels the opacity and thickness fields with `dcg-icon-opacity` and
// `dcg-icon-line-thickness` from its private icon font, so these are redrawn rather than
// copied. Both take `currentColor` — the stylesheet greys them to #949494, matching the tray's
// other previews, and that is a single source of truth for the colour.

/** Opacity: the half-filled disc, the conventional glyph for it. */
export const opacityIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%">
  <path d="M12 2.6a9.4 9.4 0 0 0 0 18.8z" fill="currentColor"/>
  <circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="1.9"/>
</svg>`;

/** Line thickness: three rules, thin to thick. Also labels the point-size field, as in Desmos. */
export const thicknessIcon = `
<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-linecap="round" fill="none">
  <path d="M3 6h18" stroke-width="1.4"/>
  <path d="M3 12h18" stroke-width="2.8"/>
  <path d="M3 18.4h18" stroke-width="4.4"/>
</svg>`;

/** The structural-error marker. Numeric errors never show this. */
export function warnIcon(): string {
  return `<svg viewBox="0 0 30 30" width="100%" height="100%">
    <path d="M15.85 4.9l11.7 20.3a.98.98 0 0 1-.85 1.47H3.3a.98.98 0 0 1-.85-1.47l11.7-20.3a.98.98 0 0 1 1.7 0z" fill="#c74440"/>
    <path d="M15 11.3v6.6" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>
    <circle cx="15" cy="22" r="1.35" fill="#fff"/>
  </svg>`;
}

/** Slider animation control. Light variant is used on a focused (blue) index cell. */
export function playIcon(light: boolean): string {
  const c = light ? '#fff' : '#7d7d7d';
  return `<svg viewBox="0 0 30 30" width="100%" height="100%">
    <circle cx="15" cy="15" r="13.2" fill="none" stroke="${c}" stroke-width="1.7"/>
    <path d="M12.2 9.6l8.4 5.4-8.4 5.4z" fill="${c}"/>
  </svg>`;
}

/** The same disc, showing the pair of bars, while the slider is animating. */
export function pauseIcon(light: boolean): string {
  const c = light ? '#fff' : '#7d7d7d';
  return `<svg viewBox="0 0 30 30" width="100%" height="100%">
    <circle cx="15" cy="15" r="13.2" fill="none" stroke="${c}" stroke-width="1.7"/>
    <rect x="10.6" y="9.6" width="3.2" height="10.8" rx="0.5" fill="${c}"/>
    <rect x="16.2" y="9.6" width="3.2" height="10.8" rx="0.5" fill="${c}"/>
  </svg>`;
}

/**
 * The loop-mode control beneath the play button.
 *
 * Desmos's three glyphs are `dcg-icon-arrow-two-way`, `-one-way` and `-once`, which is also the
 * evidence that the button cycles three modes and not the four the enum holds.
 */
export function swapIcon(light: boolean): string {
  const c = light ? '#fff' : '#7d7d7d';
  return `<svg viewBox="0 0 26 26" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3.5 9.5h19M18.5 5.5l4 4-4 4"/><path d="M22.5 16.5h-19M7.5 12.5l-4 4 4 4"/>
  </svg>`;
}

/** One arrow, always the same way: LOOP_FORWARD wraps back to the start rather than turning. */
function oneWayIcon(light: boolean): string {
  const c = light ? '#fff' : '#7d7d7d';
  return `<svg viewBox="0 0 26 26" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3.5 13h19M18.5 9l4 4-4 4"/>
  </svg>`;
}

/** One arrow into a stop bar: PLAY_ONCE halts at the far end. */
function onceIcon(light: boolean): string {
  const c = light ? '#fff' : '#7d7d7d';
  return `<svg viewBox="0 0 26 26" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.5 13h14M12.5 9l4 4-4 4"/><path d="M21 6.5v13"/>
  </svg>`;
}

export function loopIcon(mode: LoopMode, light: boolean): string {
  switch (mode) {
    case 'LOOP_FORWARD_REVERSE':
      return swapIcon(light);
    case 'LOOP_FORWARD':
      return oneWayIcon(light);
    case 'PLAY_ONCE':
      return onceIcon(light);
    // Not reachable from the button, but the enum carries it. Desmos shows the one-way arrow.
    case 'PLAY_INDEFINITELY':
      return oneWayIcon(light);
    default: {
      const never: never = mode;
      return never;
    }
  }
}
