export type Axis = 'x' | 'y'

export type Coords = { [key in Axis]: number }
export type PartialCoords = Partial<Coords>
export type CoordsLimit = PartialCoords

export interface PartialCoordsPayload extends PartialCoords {
  [extraProps: string]: any
}

export interface Middleware<P = any, T = any> {
  (payload: P): T
}

export type ExtractMiddlewarePayload<T> = T extends Middleware<infer P> ? P : unknown

export type ExtractMiddlewareReturn<T> = T extends Middleware<infer P, infer R> ? R : unknown

export type Gettable<T, Args extends any[] = any> = T | ((...args: Args) => T)
