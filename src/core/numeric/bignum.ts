// Arbitrary-precision decimals, beneath the float tower.

export interface BigNum {
  readonly tag: 'bignum';
  /** Value is mantissa * 10^exponent. */
  readonly mantissa: bigint;
  readonly exponent: number;
  readonly precision: number;
}

export function bignum(_value: number | string, _precision?: number): BigNum {
  throw new Error('TODO: bignum.bignum — not implemented in milestone 1');
}

export function addB(_a: BigNum, _b: BigNum): BigNum {
  throw new Error('TODO: bignum.addB — not implemented in milestone 1');
}

export function mulB(_a: BigNum, _b: BigNum): BigNum {
  throw new Error('TODO: bignum.mulB — not implemented in milestone 1');
}

export function toNumberB(_a: BigNum): number {
  throw new Error('TODO: bignum.toNumberB — not implemented in milestone 1');
}
