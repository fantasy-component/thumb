import { PartialCoords } from '../types'

export function isEqualCoords(a?: PartialCoords, b?: PartialCoords) {
  return a === b || (a && b && a.x === b.x && a.y === b.y)
}
