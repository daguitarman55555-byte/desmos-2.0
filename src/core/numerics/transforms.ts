import type { Complex } from '../numeric/complex.ts';

export function fft(_signal: readonly number[]): readonly Complex[] {
  throw new Error('TODO: transforms.fft — not implemented in milestone 1');
}

export function ifft(_spectrum: readonly Complex[]): readonly number[] {
  throw new Error('TODO: transforms.ifft — not implemented in milestone 1');
}

export function convolve(_a: readonly number[], _b: readonly number[]): readonly number[] {
  throw new Error('TODO: transforms.convolve — not implemented in milestone 1');
}

export function laplace(_f: (t: number) => number, _s: number): number {
  throw new Error('TODO: transforms.laplace — not implemented in milestone 1');
}
