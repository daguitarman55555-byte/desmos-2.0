// Reading and writing the document as JSON.
//
// Decision 6 is local .json files through the File System Access API, chosen because it is
// git- and OneDrive-friendly. The serialisation below is real and round-trips; the file picker
// is not wired up, because the prototype's Save button only ever toggled its own dirty state and
// milestone 1 changes no behaviour. `saveToFile` is where that arrives.

import { DEFAULT_SETTINGS, createExpression } from './document.ts';
import type { Expression, GraphDocument } from './document.ts';

export const FORMAT_VERSION = 1;

interface SerialisedDocument {
  readonly version: number;
  readonly title: string;
  readonly expressions: readonly Expression[];
  readonly views: GraphDocument['views'];
  readonly settings: GraphDocument['settings'];
}

export function serialise(doc: GraphDocument): string {
  const payload: SerialisedDocument = {
    version: FORMAT_VERSION,
    title: doc.title,
    expressions: doc.expressions,
    views: doc.views,
    settings: doc.settings,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse a saved document, tolerating missing fields so an older or hand-edited file still opens.
 * Ids are reassigned on load, because nothing outside a session should depend on them.
 */
export function deserialise(json: string): GraphDocument {
  const raw = JSON.parse(json) as Partial<SerialisedDocument>;

  const expressions = (raw.expressions ?? []).map((e, i) => {
    const base = createExpression(i + 1, e.latex ?? '');
    return {
      ...base,
      colour: e.colour ?? null,
      visible: e.visible ?? true,
      min: e.min ?? base.min,
      max: e.max ?? base.max,
      step: e.step ?? base.step,
      val: e.val ?? base.val,
    };
  });

  return {
    title: raw.title ?? 'Untitled Graph',
    expressions,
    views: raw.views ?? [{ cx: 0, cy: 0, ppu: 58 }],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
  };
}

export function saveToFile(_doc: GraphDocument): Promise<void> {
  throw new Error('TODO: persist.saveToFile — File System Access API, not in milestone 1');
}

export function openFromFile(): Promise<GraphDocument> {
  throw new Error('TODO: persist.openFromFile — File System Access API, not in milestone 1');
}

/** Import a real Desmos save, which becomes the conformance corpus (decision 4). */
export function importDesmos(_json: string): GraphDocument {
  throw new Error('TODO: persist.importDesmos — not in milestone 1');
}
