import { Gettable, Middleware, PartialCoordsPayload } from '../types'

const Math_min = (...values: any[]) => {
  return Math.min(...values.filter((v) => typeof v === 'number'))
}

const Math_max = (...values: any[]) => {
  return Math.max(...values.filter((v) => typeof v === 'number'))
}

export interface CoordsLimit {
  x?: number
  y?: number
}

interface CoordsLimits {
  min?: CoordsLimit | number
  max?: CoordsLimit | number
}

export function limit<T extends PartialCoordsPayload = any>(
  limits: Gettable<CoordsLimits | null | undefined>
): Middleware<T, T> {
  const getLimits = typeof limits === 'function' ? limits : () => limits
  return (payload) => {
    payload = { ...payload }
    let { min, max } = (getLimits(payload) || {}) as {
      min: CoordsLimit
      max: CoordsLimit
    }

    if (min && typeof min === 'number') {
      min = {
        x: min,
        y: min
      }
    }
    if (max && typeof max === 'number') {
      max = {
        x: max,
        y: max
      }
    }

    if (!min && !max) {
      return payload
    }

    if (payload.x !== undefined) {
      payload.x = Math_max(min && min.x, Math_min(max && max.x, payload.x))
    }
    if (payload.y !== undefined) {
      payload.y = Math_max(min && min.y, Math_min(max && max.y, payload.y))
    }

    return payload
  }
}
