import { Axis, Gettable, Middleware, PartialCoordsPayload } from '../types'

export function axis<T extends PartialCoordsPayload = PartialCoordsPayload>(
  axis: Gettable<Axis | undefined>
): Middleware<T, T> {
  const getAxis = typeof axis === 'function' ? axis : () => axis
  return (payload) => {
    payload = { ...payload }
    const axis = getAxis(payload)

    if (axis === 'x') {
      payload.y = payload.lastCoords.y
    }
    if (axis === 'y') {
      payload.x = payload.lastCoords.x
    }

    return payload
  }
}
