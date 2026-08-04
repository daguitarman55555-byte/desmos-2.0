import type { ListValue } from './kind.ts';

export function map(_a: ListValue, _f: (x: number, i: number) => number): ListValue {
  throw new Error('TODO: list.map — not implemented in milestone 1');
}

export function filter(_a: ListValue, _f: (x: number, i: number) => boolean): ListValue {
  throw new Error('TODO: list.filter — not implemented in milestone 1');
}

export function reduce(_a: ListValue, _f: (acc: number, x: number) => number, _init: number): number {
  throw new Error('TODO: list.reduce — not implemented in milestone 1');
}

export function total(_a: ListValue): number {
  throw new Error('TODO: list.total — not implemented in milestone 1');
}

export function mean(_a: ListValue): number {
  throw new Error('TODO: list.mean — not implemented in milestone 1');
}

export function median(_a: ListValue): number {
  throw new Error('TODO: list.median — not implemented in milestone 1');
}

export function stdev(_a: ListValue): number {
  throw new Error('TODO: list.stdev — not implemented in milestone 1');
}
