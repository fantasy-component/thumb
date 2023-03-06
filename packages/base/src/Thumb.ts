export type Direction = 'horizontal' | 'vertical' | 'omnidirectional'

export interface Position {
  x: number
  y: number
}

export interface PositionLimits {
  x?: number
  y?: number
}

const EMPTY_LIMITS = {} as any

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
  private position: Position
  private offset: Position | null = null
  private departurePosition: Position | null = null
  private positionLimits: {
    min: PositionLimits | undefined
    max: PositionLimits | undefined
  } = EMPTY_LIMITS

  private options!: PrivateThumbOptions

  constructor(position?: Position | null | undefined, options?: ThumbOptions) {
    this.position = {
      x: 0,
      y: 0,
      ...position
    }
    this.setOptions(options)
  }

  setOptions(options?: ThumbOptions | ThumbOptionsSetter) {
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

  updatePositionLimits() {
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
      this.positionLimits = EMPTY_LIMITS
    }
  }

  getPosition() {
    return { ...this.position }
  }

  restrictedPosition(quiet?: boolean) {
    this.setPosition(this.position, quiet)
  }

  setPosition(position: Position, quiet?: boolean) {
    const distance = this.calcDistance(position)

    if (distance) {
      const { position } = this
      this.position = {
        x: position.x + distance.x,
        y: position.y + distance.y
      }

      if (!quiet) {
        this.options.onChange?.(this.position)
      }

      return this.position
    }
  }

  move(position: Position, offset?: Position) {
    if (!this.departurePosition) {
      this.departurePosition = this.getPosition()
    }

    if (offset) {
      this.offset = offset
    }

    const actualPosition = this.getActualPosition(position, this.offset)
    return this.setPosition(actualPosition)
  }

  terminateMove() {
    this.departurePosition = null
    this.offset = null
  }

  getActualPosition({ x, y }: Position, offset?: Position | null) {
    if (offset) {
      if (x && offset.x) {
        x -= offset.x
      }
      if (y && offset.y) {
        y -= offset.y
      }
    }

    return {
      x,
      y
    }
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

  calcDistance({ x, y }: Position) {
    const { options, position, positionLimits } = this
    const { direction } = options

    if (positionLimits !== EMPTY_LIMITS) {
      const { min, max } = positionLimits

      if (x) {
        x = Math_max(min && (min.x as any), Math_min(max && (max.x as any), x))
      }
      if (y) {
        y = Math_max(min && (min.y as any), Math_min(max && (max.y as any), y))
      }
    }

    let dx = 0
    let dy = 0
    if (direction !== 'vertical' && x) {
      dx = x - position.x
    }
    if (direction !== 'horizontal' && y) {
      dy = y - position.y
    }

    if (dx || dy) {
      return {
        x: dx,
        y: dy
      }
    }
  }
}

export function createThumb(position?: Position | null, options?: ThumbOptions) {
  return new Thumb(position, options)
}
