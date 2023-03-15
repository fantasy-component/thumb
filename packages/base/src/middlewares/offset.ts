import { Gettable, Middleware, PartialCoords, PartialCoordsPayload } from '../types'

export function offset<T extends PartialCoordsPayload = PartialCoordsPayload>(
  offset?: Gettable<PartialCoords | null | undefined, [T]>
): Middleware<T, T> {
  const getOffset = typeof offset === 'function' ? offset : () => offset
  return (payload) => {
    payload = { ...payload }
    const offset = getOffset(payload)

    if (!offset || (!offset.x && !offset.y)) {
      return payload
    }

    if (payload.x !== undefined && offset.x !== undefined) {
      payload.x -= offset.x
    }
    if (payload.y !== undefined && offset.y !== undefined) {
      payload.y -= offset.y
    }

    return payload
  }
}
