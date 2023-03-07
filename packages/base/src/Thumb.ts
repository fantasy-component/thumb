export type Direction = 'horizontal' | 'vertical' | 'omnidirectional'

export interface Position {
  x: number
  y: number
}

export type PartialPosition = Partial<Position>

export interface PositionLimits {
  x?: number
  y?: number
}

const defaultPositionLimits = {} as const as any

function Math_min(...values: any[]) {
  return Math.min(...values.filter((v) => typeof v === 'number'))
}

function Math_max(...values: any[]) {
  return Math.max(...values.filter((v) => typeof v === 'number'))
}

export type PositionChangeCallback = (position: Position) => void

export interface ThumbOptions {
  direction?: Direction
  min?: number | PositionLimits
  max?: number | PositionLimits
  onChange?: PositionChangeCallback
}

const defaultOptions = {
  direction: 'horizontal'
} as const

type PrivateThumbOptions = Required<Pick<ThumbOptions, keyof typeof defaultOptions>> & ThumbOptions

export type ThumbOptionsSetter = (privateOptions: PrivateThumbOptions) => PrivateThumbOptions

export class Thumb {
  /**
   * Position always has a value.
   * For the scene that pays attention to the location of Thumb, users usually pass in a default position
   * For the scene when dragging the position when dragging Thumb, we use `{x: 0, y: 0}` by default
   */
  private position: Position
  private departurePosition: Position | null = null

  private options!: PrivateThumbOptions
  private positionLimits: {
    min?: PositionLimits
    max?: PositionLimits
  } = defaultPositionLimits

  constructor(position?: PartialPosition | null, options?: ThumbOptions) {
    this.position = {
      x: 0,
      y: 0,
      ...position
    }
    this.setOptions(options)
  }

  setOptions(options: ThumbOptions | ThumbOptionsSetter | null | undefined) {
    if (typeof options === 'function') {
      this.options = options({ ...this.options })
    } else {
      this.options = {
        ...defaultOptions,
        ...options
      }
    }

    this.updatePositionLimits()
  }

  private updatePositionLimits() {
    let { min, max } = this.options
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

    if (min !== undefined || max !== undefined) {
      this.positionLimits = {
        min,
        max
      } as any
    } else {
      this.positionLimits = defaultPositionLimits
    }
  }

  getPosition() {
    return { ...this.position }
  }

  /**
   * Only when the position is changed will it notify and return the new position
   */
  setPosition(position: PartialPosition, quiet?: boolean) {
    const distance = this.calcDistance(position)

    if (distance) {
      const { position } = this
      this.position = {
        x: position.x + distance.x,
        y: position.y + distance.y
      }

      const newPosition = this.getPosition()

      if (!quiet) {
        this.options.onChange?.(newPosition)
      }

      return newPosition
    }
  }

  calcDistance({ x, y }: PartialPosition) {
    const { options, position, positionLimits } = this
    const { direction } = options
    const { min, max } = positionLimits

    let dx = 0
    let dy = 0
    if (x !== undefined) {
      x = Math_max(min && min.x, Math_min(max && max.x, x))

      if (direction !== 'vertical') {
        dx = x - position.x
      }
    }
    if (y !== undefined) {
      y = Math_max(min && min.y, Math_min(max && max.y, y))

      if (direction !== 'horizontal') {
        dy = y - position.y
      }
    }

    if (dx || dy) {
      return {
        x: dx,
        y: dy
      }
    }
  }

  /**
   * Apply to the situation that has changed `Limits`
   */
  refreshPosition() {
    return this.setPosition(this.getPosition())
  }

  /**
   * When using the move, we will record the position before the first move
   * to calculate the move distance
   *
   * You can terminate the move through `Thumb.terminateMove()`
   */
  move(position: PartialPosition) {
    if (!this.departurePosition) {
      this.departurePosition = this.getPosition()
    }

    return this.setPosition(position)
  }

  terminateMove() {
    this.departurePosition = null
  }

  getMoveDistance() {
    const { departurePosition } = this

    if (departurePosition) {
      const { position } = this
      return {
        x: position.x - departurePosition.x,
        y: position.y - departurePosition.y
      }
    }
  }
}

export function createThumb(position?: PartialPosition | null, options?: ThumbOptions) {
  return new Thumb(position, options)
}
