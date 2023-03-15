import { Coords, Middleware, PartialCoords, PartialCoordsPayload } from './types'

export interface ThumbPayload extends PartialCoordsPayload {
  lastCoords: Coords
}

export type ChangeCallback = (coords: Coords) => void

export interface ThumbOptions {
  /**
   * Allows to control the change of coords through the form of middleware.
   */
  middleware?: Middleware<ThumbPayload, PartialCoordsPayload>
  /**
   * The callback function when the coords changes.
   */
  onChange?: ChangeCallback
}

export class Thumb {
  /**
   * Coords always has a value
   * - For the scene that pays attention to the location of Thumb, users usually pass in a default coords
   * - For the scene when dragging the coords when dragging Thumb, we use `{x: 0, y: 0}` by default
   */
  private coords: Coords
  private options!: ThumbOptions

  constructor(coords?: PartialCoords | null | undefined, options?: ThumbOptions) {
    this.coords = {
      x: 0,
      y: 0,
      ...coords
    }
    this.setOptions(options)
  }

  getOptions() {
    return { ...this.options }
  }

  setOptions(options: ThumbOptions | null | undefined) {
    this.options = {
      ...this.options,
      ...options
    }
  }

  getCoords() {
    return { ...this.coords }
  }

  /**
   * only when the coords is changed will it notify and return the new coords
   */
  setCoords(coords: PartialCoords, quiet?: boolean) {
    const distance = this.computeDistance(coords)

    if (distance) {
      const { coords } = this
      this.coords = {
        x: coords.x + distance.x,
        y: coords.y + distance.y
      }

      const freeCoords = this.getCoords()

      if (!quiet) {
        this.options.onChange?.(freeCoords)
      }

      return freeCoords
    }
  }

  computeDistance(nextCoords: PartialCoords) {
    const { options, coords } = this

    if (options.middleware) {
      nextCoords = options.middleware({ ...nextCoords, lastCoords: coords })
    }

    const { x, y } = nextCoords

    let dx = 0
    let dy = 0

    if (x !== undefined) {
      dx = x - coords.x
    }
    if (y !== undefined) {
      dy = y - coords.y
    }

    if (dx || dy) {
      return {
        x: dx,
        y: dy
      }
    }
  }
}

export function createThumb(coords?: PartialCoords | null, options?: ThumbOptions) {
  return new Thumb(coords, options)
}
