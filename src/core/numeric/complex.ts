// Complex arithmetic. Desmos ships a complex mode; parity is the baseline, domain
// colouring in graph/plotters/domaincolor.ts is the extension.

export interface Complex {
  readonly tag: 'complex';
  readonly re: number;
  readonly im: number;
}

export const complex = (re: number, im: number): Complex => ({ tag: 'complex', re, im });

export function addC(_a: Complex, _b: Complex): Complex {
  throw new Error('TODO: complex.addC — not implemented in milestone 1');
}

export function mulC(_a: Complex, _b: Complex): Complex {
  throw new Error('TODO: complex.mulC — not implemented in milestone 1');
}

export function absC(_a: Complex): number {
  throw new Error('TODO: complex.absC — not implemented in milestone 1');
}

export function argC(_a: Complex): number {
  throw new Error('TODO: complex.argC — not implemented in milestone 1');
}
