import { DOMCoordsChangeType, ThumbDOMPayload } from '../ThumbDOM'
import { Gettable, Middleware, PartialCoords } from '../types'
import { offset as offsetMiddleware } from './offset'

export function offsetDOM<T extends ThumbDOMPayload = ThumbDOMPayload>(
  reference: Gettable<HTMLElement | null | undefined | false, [T]>
): Middleware<T, T> {
  const getReference = typeof reference === 'function' ? reference : () => reference

  let offset: PartialCoords | null = null
  let offsetExpired = false

  const getOffset = () => {
    return offset
  }

  return (payload) => {
    const { type, element } = payload.dom

    if (type === DOMCoordsChangeType.DRAG_START) {
      const reference = getReference(payload)
      if (reference === false) {
        offset = null
      } else {
        const rect = (reference || element).getBoundingClientRect()
        offset = {
          x: payload.x! - rect.left,
          y: payload.y! - rect.top
        }
      }
      offsetExpired = false
    } else if (offsetExpired || type === DOMCoordsChangeType.MANUAL) {
      offset = null
      offsetExpired = false
    }

    if (type === DOMCoordsChangeType.DRAG_END && offset) {
      // clean up the offset after the drag is over
      offsetExpired = true
    }

    return offsetMiddleware<T>(getOffset)(payload)
  }
}
