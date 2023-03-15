import { keep } from '../middlewares/keep'
import { ExtractMiddlewarePayload, ExtractMiddlewareReturn, Middleware } from '../types'

export type ExtractLastElement<Elements> = Elements extends [infer Element]
  ? Element
  : Elements extends [any, ...infer Later]
  ? ExtractLastElement<Later>
  : never

export function compose(): Middleware
export function compose<M1 extends Middleware>(m1: M1): M1
export function compose<M1 extends Middleware, M2 extends Middleware<ExtractMiddlewareReturn<M1>>>(
  m1: M1,
  m2: M2
): Middleware<ExtractMiddlewarePayload<M1>, ExtractMiddlewareReturn<M2>>
export function compose<
  M1 extends Middleware,
  M2 extends Middleware<ExtractMiddlewareReturn<M1>>,
  M3 extends Middleware<ExtractMiddlewareReturn<M2>>
>(m1: M1, m2: M2, m3: M3): Middleware<ExtractMiddlewarePayload<M1>, ExtractMiddlewareReturn<M3>>
export function compose<
  M1 extends Middleware,
  M2 extends Middleware<ExtractMiddlewareReturn<M1>>,
  M3 extends Middleware<ExtractMiddlewareReturn<M2>>,
  M4 extends Middleware<ExtractMiddlewareReturn<M3>>
>(
  m1: M1,
  m2: M2,
  m3: M3,
  m4: M4
): Middleware<ExtractMiddlewarePayload<M1>, ExtractMiddlewareReturn<M4>>
export function compose<
  M1 extends Middleware,
  M2 extends Middleware<ExtractMiddlewareReturn<M1>>,
  M3 extends Middleware<ExtractMiddlewareReturn<M2>>,
  M4 extends Middleware<ExtractMiddlewareReturn<M3>>,
  M5 extends Middleware<ExtractMiddlewareReturn<M4>>
>(
  m1: M1,
  m2: M2,
  m3: M3,
  m4: M4,
  m5: M5
): Middleware<ExtractMiddlewarePayload<M1>, ExtractMiddlewareReturn<M5>>
export function compose<Middlewares extends Middleware[]>(
  ...middlewares: Middlewares
): Middleware<
  ExtractMiddlewarePayload<Middlewares[0]>,
  ExtractMiddlewareReturn<ExtractLastElement<Middlewares>>
>
export function compose(...middlewares: Middleware[]) {
  middlewares = middlewares.filter(Boolean)

  if (middlewares.length === 0) {
    return keep
  }

  if (middlewares.length === 1) {
    return middlewares[0]
  }

  return middlewares.reduce((a, b) => (payload) => b(a(payload)))
}
