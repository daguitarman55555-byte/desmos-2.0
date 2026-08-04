// Entry point: wire store -> ui -> panes.
//
// This is the only module that may reach in every direction, and it is deliberately the only
// place where the pieces know about each other. Everything below it is testable in isolation.

import './styles/tokens.css';
import './styles/chrome.css';
import './styles/expressions.css';
import './styles/graph.css';
import './styles/menus.css';

import { compile } from './core/eval/compile.ts';
import { asScalar } from './core/eval/backend.ts';
import { coordinateToLatex, latexToSource } from './core/lang/latex.ts';
import { parseSource } from './core/lang/parse.ts';
import { computePointsOfInterest, formatCoordinate, orientationOf } from './core/poi.ts';
import type { POI, POICurve } from './core/poi.ts';
import { Renderer } from './graph/renderer.ts';
import type { Drawable, FrameTimings, Scene } from './graph/renderer.ts';
import { pickCurve } from './graph/pick.ts';
import { findPin, pickPOI, samePoint, tracePoint } from './graph/trace.ts';
import { Viewport, ZOOM_STEP } from './graph/viewport.ts';
import { History, snapshotOf } from './state/history.ts';
import type { Snapshot } from './state/history.ts';
import { Selection } from './state/selection.ts';
import { Store } from './state/store.ts';
import type { Expression } from './state/document.ts';
import { createExpressionList } from './ui/ExpressionList.ts';
import type { RowCallbacks } from './ui/ExpressionRow.ts';
import { LEFT, initMathQuill } from './ui/MathField.ts';
import { labelItems } from './ui/PointLabel.ts';
import { createSettingsPanel } from './ui/SettingsPanel.ts';
import { createShell } from './ui/shell.ts';

/** Movement in pixels below which a press counts as a click rather than a drag. */
const CLICK_SLOP = 4;

async function boot(): Promise<void> {
  await initMathQuill();

  const root = document.getElementById('app-root');
  if (!root) throw new Error('#app-root missing from index.html');

  const store = new Store();
  const history = new History();
  const selection = new Selection();
  const view = new Viewport();
  const showPerf = new URLSearchParams(location.search).has('perf');

  let restoring = false;
  let lastRecomputeMs = 0;

  const shell = createShell(root, {
    onAdd: () => {
      const created = store.append();
      renderList();
      focusRow(created, false);
    },
    onUndo: () => applySnapshot(history.undo()),
    onRedo: () => applySnapshot(history.redo()),
    onCollapse: () => undefined,
    onLayoutChange: () => resize(),
    onZoomIn: () => { view.zoomBy(ZOOM_STEP); draw(); },
    onZoomOut: () => { view.zoomBy(1 / ZOOM_STEP); draw(); },
    onHome: () => { view.resetToDefault(); draw(); },
    onWrench: () => { settingsPanel.toggle(); syncSettingsPanel(); },
  });

  const settingsPanel = createSettingsPanel({
    onChange: (patch) => {
      store.patchSettings(patch);
      shell.header.setDirty(store.dirty);
      draw();
    },
    onBoundsChange: (patch) => {
      view.setBounds(patch);
      draw();
    },
    // The panel's bounds and step are full math fields, so "pi", "4pi" and "e^3" all work, and
    // they resolve against the document scope — a bound may reference a slider variable.
    evaluateLatex: (latex) => {
      const src = latexToSource(latex).trim();
      if (!src) return NaN;
      try {
        return asScalar(compile(parseSource(src))({ x: 0, y: 0 }, store.scope));
      } catch {
        return NaN;
      }
    },
  });
  shell.graph.mountOverlay(settingsPanel.element);

  const syncSettingsPanel = (): void => {
    if (!settingsPanel.isOpen) return;
    settingsPanel.update({ ...store.settings }, view.boundsObject());
  };

  const renderer = new Renderer(shell.graph.context, view, store.scope);
  shell.graph.showPerf(showPerf);

  const list = createExpressionList({ rowCallbacks: makeRowCallbacks }, LEFT());
  shell.listHost.replaceWith(list.element);

  // ── Rendering ──────────────────────────────────────────────────────────────────────────────

  function renderList(): void {
    store.ensureTrailingBlank();
    list.render(store.expressions, store.analyses, selection.focusedId);
    shell.header.setDirty(store.dirty);
    shell.toolbar.setHistoryState(history.canUndo, history.canRedo);
  }

  function recompute(): void {
    const start = performance.now();
    store.recompute();
    lastRecomputeMs = performance.now() - start;
  }

  function drawables(): Drawable[] {
    const out: Drawable[] = [];
    for (const e of store.expressions) {
      const analysis = store.analyses.get(e.id);
      if (!analysis?.fn || analysis.error || analysis.kind === null) continue;
      if (!e.visible || e.latex.trim() === '') continue;
      out.push({
        id: e.id,
        kind: analysis.kind,
        colour: e.colour ?? '#000',
        visible: true,
        fn: analysis.fn,
        lineStyle: e.lineStyle,
        pointStyle: e.pointStyle,
        lineWidth: e.lineWidth,
        pointSize: e.pointSize,
      });
    }
    return out;
  }

  /** Curves the points-of-interest scan can sweep, i.e. everything explicit and visible. */
  function sweepableCurves(): Array<{ id: number; curve: POICurve }> {
    const out: Array<{ id: number; curve: POICurve }> = [];
    for (const e of store.expressions) {
      const analysis = store.analyses.get(e.id);
      if (!analysis?.fn || analysis.error || !e.visible) continue;
      const orientation = orientationOf(analysis.kind);
      if (!orientation) continue;
      out.push({ id: e.id, curve: { fn: analysis.fn, orientation } });
    }
    return out;
  }

  function computePOIs(): POI[] {
    if (selection.selectedId === null) return [];
    const curves = sweepableCurves();
    const target = curves.find((c) => c.id === selection.selectedId);
    if (!target) return [];

    const [left, right, bottom, top] = view.bounds();
    const [a, b] = target.curve.orientation === 'y' ? [left, right] : [bottom, top];

    return computePointsOfInterest(
      target.curve,
      curves.filter((c) => c.id !== selection.selectedId).map((c) => c.curve),
      a,
      b,
      store.scope,
      view.screenMetric(),
    );
  }

  let pois: POI[] = [];

  function draw(): void {
    if (!view.width || !view.height) return;
    shell.graph.setHomeVisible(view.userMoved);

    pois = computePOIs();

    const scene: Scene = {
      drawables: drawables(),
      selectedId: selection.selectedId,
      pois,
      pins: selection.pins,
      hover: selection.hover,
      axes: store.settings,
    };

    const timings: FrameTimings = renderer.render(scene);
    syncSettingsPanel();

    shell.graph.labels.render(
      labelItems(selection.pins, selection.hover),
      (x, y) => view.project(x, y),
      exportPoint,
    );

    if (showPerf) shell.graph.updatePerf(timings, lastRecomputeMs);
  }

  function refresh(): void {
    recompute();
    renderList();
    draw();
  }

  // ── Focus and history ──────────────────────────────────────────────────────────────────────

  function focusRow(expression: Expression, toEnd: boolean): void {
    // Focusing a row selects its curve, which is what makes points of interest appear.
    selection.focus(expression.id);
    renderList();
    list.rowFor(expression.id)?.math.focus(toEnd);
    draw();
  }

  function scheduleSnapshot(): void {
    history.schedule(() => snapshotOf(store.expressions));
  }

  function applySnapshot(snapshot: Snapshot | null): void {
    if (!snapshot) return;
    restoring = true;
    try {
      list.clear();
      store.reset(
        snapshot.map((s) => {
          const created = store.create(s.latex);
          created.colour = s.colour;
          created.min = s.min;
          created.max = s.max;
          created.val = s.val;
          created.visible = s.visible;
          return created;
        }),
      );
      selection.focusedId = null;
      renderList();
      // Rows exist now; push the latex into each field without re-triggering edit handlers.
      for (const e of store.expressions) {
        if (e.latex) list.rowFor(e.id)?.math.setLatexQuietly(e.latex);
      }
    } finally {
      restoring = false;
    }
    refresh();
  }

  function exportPoint(poi: POI): void {
    const latex = coordinateToLatex(formatCoordinate(poi.x), formatCoordinate(poi.y));
    const created = store.insertBeforeTrailingBlank(latex);
    renderList();
    list.rowFor(created.id)?.math.setLatexQuietly(latex);
    store.markDirty();
    refresh();
    history.push(snapshotOf(store.expressions));
  }

  function makeRowCallbacks(expression: Expression): RowCallbacks {
    const index = (): number => store.expressions.indexOf(expression);

    return {
      onEdit(latex) {
        if (restoring) return;
        store.setLatex(expression, latex);
        renderList();
        draw();
        scheduleSnapshot();
      },
      onEnter() {
        const created = store.insertAfter(expression);
        renderList();
        focusRow(created, false);
      },
      onUp() {
        const i = index();
        if (i > 0) focusRow(store.expressions[i - 1] as Expression, true);
      },
      onDown() {
        const i = index();
        if (i < store.expressions.length - 1) focusRow(store.expressions[i + 1] as Expression, false);
      },
      onDeleteOutOfLeft() {
        if (expression.latex.trim() !== '' || store.expressions.length <= 1) return;
        const i = index();
        store.remove(expression);
        renderList();
        const target = store.expressions[Math.max(0, i - 1)];
        if (target) focusRow(target, true);
        draw();
      },
      onFocusRequest() {
        focusRow(expression, true);
      },
      onToggleVisible() {
        // A variable definition has no curve to hide; its icon is the animation control.
        if (store.analyses.get(expression.id)?.kind === 'slider') return;
        expression.visible = !expression.visible;
        renderList();
        draw();
      },
      onDelete() {
        store.remove(expression);
        renderList();
        draw();
        history.push(snapshotOf(store.expressions));
      },
      onSliderValue(value) {
        store.setSliderValue(expression, value);
        renderList();
        list.rowFor(expression.id)?.math.setLatexQuietly(expression.latex);
        draw();
        scheduleSnapshot();
      },
      onSliderMin(value) {
        expression.min = value;
        renderList();
      },
      onSliderMax(value) {
        expression.max = value;
        renderList();
      },
      onSliderStep(value) {
        expression.step = value;
      },
    };
  }

  // ── Canvas sizing ──────────────────────────────────────────────────────────────────────────

  function resize(): void {
    const { canvas, context } = shell.graph;
    view.dpr = window.devicePixelRatio || 1;
    view.width = shell.graph.element.clientWidth;
    view.height = shell.graph.element.clientHeight;
    canvas.width = Math.round(view.width * view.dpr);
    canvas.height = Math.round(view.height * view.dpr);
    context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (!view.userMoved) view.fit();
    draw();
  }

  // ── Pointer interaction ────────────────────────────────────────────────────────────────────

  const localPoint = (ev: MouseEvent): readonly [number, number] => {
    const rect = shell.graph.canvas.getBoundingClientRect();
    return [ev.clientX - rect.left, ev.clientY - rect.top];
  };

  const project = (x: number, y: number): readonly [number, number] => view.project(x, y);
  const unproject = (px: number, py: number): readonly [number, number] => [view.toMX(px), view.toMY(py)];

  let mode: 'pan' | 'trace' | null = null;
  let tracedId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let downX = 0;
  let downY = 0;
  let moved = false;

  shell.graph.canvas.addEventListener('mousedown', (ev) => {
    const [mx, my] = localPoint(ev);
    moved = false;
    downX = ev.clientX;
    downY = ev.clientY;

    const poi = pickPOI(pois, project, mx, my);
    const hit = poi ? null : pickCurve(renderer.pickable(sceneForPicking()), mx, my);

    if (poi || hit) {
      mode = 'trace';
      if (hit) {
        tracedId = hit.id;
        selection.selectedId = hit.id;
        selection.focusedId = hit.id;
        renderList();
        const [x, y] = unproject(hit.sx, hit.sy);
        selection.hover = { x, y, type: 'trace' };
      } else {
        tracedId = selection.selectedId;
        selection.hover = poi;
      }
      shell.graph.canvas.style.cursor = 'pointer';
      draw();
      return;
    }

    mode = 'pan';
    lastX = ev.clientX;
    lastY = ev.clientY;
  });

  function sceneForPicking(): Scene {
    return {
      drawables: drawables(),
      selectedId: selection.selectedId,
      pois,
      pins: selection.pins,
      hover: selection.hover,
      axes: store.settings,
    };
  }

  window.addEventListener('mousemove', (ev) => {
    if (mode === 'trace') {
      if (Math.abs(ev.clientX - downX) + Math.abs(ev.clientY - downY) >= CLICK_SLOP) moved = true;
      const [mx, my] = localPoint(ev);
      const paths = tracedId === null ? null : renderer.paths.get(tracedId) ?? null;
      const p = tracePoint(paths, pois, project, unproject, mx, my);
      if (p && !samePoint(p, selection.hover)) {
        selection.hover = p;
        draw();
      }
      return;
    }

    if (mode === 'pan') {
      if (!moved && Math.abs(ev.clientX - downX) + Math.abs(ev.clientY - downY) < CLICK_SLOP) return;
      moved = true;
      shell.graph.canvas.style.cursor = 'move';
      view.panByPixels(ev.clientX - lastX, ev.clientY - lastY);
      lastX = ev.clientX;
      lastY = ev.clientY;
      draw();
      return;
    }

    const [mx, my] = localPoint(ev);
    if (mx < 0 || my < 0 || mx > view.width || my > view.height) {
      if (selection.hover) {
        selection.hover = null;
        draw();
      }
      return;
    }

    let next = pickPOI(pois, project, mx, my);
    if (!next) {
      const hit = pickCurve(renderer.pickable(sceneForPicking()), mx, my);
      if (hit) {
        const [x, y] = unproject(hit.sx, hit.sy);
        next = { x, y, type: 'trace' };
      }
    }
    shell.graph.canvas.style.cursor = next ? 'pointer' : 'default';
    if (!samePoint(next, selection.hover)) {
      selection.hover = next;
      draw();
    }
  });

  window.addEventListener('mouseup', () => {
    if (mode === 'trace') {
      if (selection.hover) {
        const existing = findPin(selection.pins, selection.hover, project);
        // A plain click toggles the pin; a drag always leaves one behind.
        if (!moved) {
          if (existing >= 0) selection.pins.splice(existing, 1);
          else selection.pins.push({ ...selection.hover });
        } else if (existing < 0) {
          selection.pins.push({ ...selection.hover });
        }
      }
      mode = null;
      tracedId = null;
      shell.graph.canvas.style.cursor = 'default';
      draw();
      return;
    }

    if (mode === 'pan') {
      mode = null;
      shell.graph.canvas.style.cursor = 'default';
      if (!moved) {
        selection.clear();
        renderList();
        draw();
      }
    }
  });

  shell.graph.canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const [px, py] = localPoint(ev);
      view.zoomAt(px, py, ev.deltaY);
      draw();
    },
    { passive: false },
  );

  shell.graph.canvas.addEventListener('dblclick', () => {
    view.resetToDefault();
    draw();
  });

  // Clicking away closes the panel, but clicking inside it must not.
  document.addEventListener('mousedown', (ev) => {
    if (!settingsPanel.isOpen) return;
    const target = ev.target as HTMLElement;
    if (settingsPanel.element.contains(target) || target.closest('#wrench-btn')) return;
    settingsPanel.close();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && settingsPanel.isOpen) {
      settingsPanel.close();
      return;
    }
    if (!(ev.ctrlKey || ev.metaKey)) return;
    const key = ev.key.toLowerCase();
    if (key === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      applySnapshot(history.undo());
    } else if (key === 'y' || (key === 'z' && ev.shiftKey)) {
      ev.preventDefault();
      applySnapshot(history.redo());
    }
  });

  // The canvas tracks its own box, so window resizes, panel drags and panel collapse all reflow
  // through one code path.
  new ResizeObserver(() => resize()).observe(shell.graph.element);
  window.addEventListener('resize', resize);

  // ── Boot ───────────────────────────────────────────────────────────────────────────────────
  const first = store.append();
  selection.focusedId = first.id;
  refresh();
  resize();
  focusRow(first, false);
  history.push(snapshotOf(store.expressions));
  // Focusing the first row would otherwise leave the document looking edited before any input.
  store.dirty = false;
  shell.header.setDirty(false);
}

void boot();
