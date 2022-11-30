/**
 * Test utilities
 */

import { IsExact } from 'conditional-type-checks';

import { Infer } from '../../Infer';

type Exact<A, B, Optional> = IsExact<
  Infer<A>,
  [Optional] extends [true] ? { type?: B } : { type: B }
> extends true
  ? true
  : {
      'INVALID_RESULT >': Infer<{ type: A }> extends infer T
        ? T[keyof T] & { optional: Optional }
        : ':::ERROR:::';
    };

type ExactFields<A, B> = {
  [K in keyof A as K extends keyof B
    ? IsExact<B[K], A[K]> extends true
      ? never
      : K
    : K]: A[K];
};

export function _assert<A, B, Optional = false>(res: Exact<A, B, Optional>) {
  return [res] as any;
}

// assert with IsExact and shows the wrong fields if any
export function _assertFields<A, B>(
  res: [keyof ExactFields<A, B>] extends [never]
    ? true
    : keyof ExactFields<A, B>
): { [K in keyof ExactFields<A, B>]: A[K] } {
  return [res] as any;
}
