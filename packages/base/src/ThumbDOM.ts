import {
  createThumb,
  Direction,
  Position,
  PositionChangeCallback,
  PositionLimits,
  Thumb
} from './Thumb'

export const BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
} as const

function ownerDocument(node: Node | null | undefined): Document {
  return node?.ownerDocument || document
}

export interface ThumbDOMOptions {
  disabled?: boolean
  direction?: Direction
  min?: number | PositionLimits
  max?: number | PositionLimits
  buttons?: number[]
  onChange?: PositionChangeCallback
  onDragStart?: (event: TouchEvent | MouseEvent, finger: Position) => void
  onDragging?: (event: TouchEvent | MouseEvent, finger: Position) => void
  onDragEnd?: (event: TouchEvent | MouseEvent, finger: Position) => void
}

const defaultOptions = {
  disabled: false,
  direction: 'horizontal',
  buttons: [BUTTONS.LEFT] as any[]
} as const

export class ThumbDOM {
  private thumb: Thumb
  private thumbElement: HTMLElement | null = null
  private touchId: number | null = null
  private dragging: boolean = false
  private offset: Position | null = null

  private options!: Required<Pick<ThumbDOMOptions, keyof typeof defaultOptions>> & ThumbDOMOptions

  constructor(element: HTMLElement | null | undefined, options?: ThumbDOMOptions) {
    this.thumb = createThumb()
    this.setOptions(options)

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    if (element) {
      this.registerThumbElement(element)
    }
  }

  setOptions(options: ThumbDOMOptions = {}) {
    const { disabled, direction, min, max } = (this.options = {
      ...defaultOptions,
      ...options
    })
    this.thumb.setOptions({ direction, min, max })
    this.setDisabled(!!disabled)
  }

  get disabled() {
    return this.options.disabled
  }

  setDisabled(disabled: boolean) {
    if (this.options.disabled !== disabled) {
      this.options.disabled = disabled

      if (disabled) {
        this.stopDragListening()
        this.thumb.terminateMove()
      }
    }
  }

  setOffset(offset?: Position | null | undefined) {
    this.offset = offset ? { ...offset } : null
  }

  getPosition() {
    return this.thumb.getPosition()
  }

  private offsetPosition({ x, y }: Position) {
    const { offset } = this

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

  getDragDistance() {
    return this.thumb.getMoveDistance()
  }

  registerThumbElement(element: HTMLElement | null) {
    this.unregisterThumbElement()

    this.thumbElement = element
    if (element) {
      element.addEventListener('mousedown', this.handleMouseDown)
      element.addEventListener('touchstart', this.handleTouchStart)
    }
  }

  unregisterThumbElement() {
    const { thumbElement } = this
    if (thumbElement) {
      thumbElement.removeEventListener('mousedown', this.handleMouseDown)
      thumbElement.removeEventListener('touchstart', this.handleTouchStart)
      this.stopDragListening()
      this.thumb.terminateMove()
      this.thumbElement = null
    }
  }

  private stopDragListening() {
    const doc = ownerDocument(this.thumbElement)
    doc.removeEventListener('mousemove', this.handleTouchMove)
    doc.removeEventListener('mouseup', this.handleTouchEnd)
    doc.removeEventListener('touchmove', this.handleTouchMove)
    doc.removeEventListener('touchend', this.handleTouchEnd)
  }

  private handleChange(position: Position) {
    this.options.onChange?.(position)
  }

  private handleTouchStart(event: TouchEvent) {
    if (this.disabled) {
      return
    }

    const touch = event.changedTouches[0]
    if (touch) {
      this.touchId = touch.identifier
    }

    const finger = this.trackFinger(event)!

    this.options.onDragStart?.(event, finger)

    const actualPosition = this.offsetPosition(finger)
    const fingerValue = this.thumb.move(actualPosition)

    if (fingerValue) {
      this.handleChange(fingerValue)
    }

    const doc = ownerDocument(this.thumbElement)
    doc.addEventListener('touchmove', this.handleTouchMove)
    doc.addEventListener('touchend', this.handleTouchEnd)
  }

  private handleTouchMove(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    this.options.onDragging?.(event, finger)

    const actualPosition = this.offsetPosition(finger)
    const fingerValue = this.thumb.move(actualPosition)

    if (!this.dragging) {
      this.dragging = true
    }

    if (fingerValue) {
      this.handleChange(fingerValue)
    }
  }

  private handleTouchEnd(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    this.options.onDragEnd?.(event, finger)

    const actualPosition = this.offsetPosition(finger)
    const fingerValue = this.thumb.move(actualPosition)

    this.dragging = false
    this.touchId = null

    if (fingerValue) {
      this.handleChange(fingerValue)
    }

    this.stopDragListening()
    this.thumb.terminateMove()
  }

  private handleMouseDown(event: MouseEvent) {
    if (this.disabled) {
      return
    }

    if (event.defaultPrevented) {
      return
    }

    const { options } = this
    if (!options.buttons.includes(event.button)) {
      return
    }

    // Avoid text selection
    event.preventDefault()

    const finger = this.trackFinger(event)!

    options.onDragStart?.(event, finger)

    const actualPosition = this.offsetPosition(finger)
    const fingerValue = this.thumb.move(actualPosition)

    if (fingerValue) {
      this.handleChange(fingerValue)
    }

    const doc = ownerDocument(this.thumbElement)
    doc.addEventListener('mousemove', this.handleTouchMove)
    doc.addEventListener('mouseup', this.handleTouchEnd)
  }

  private trackFinger(event: TouchEvent | MouseEvent) {
    const { touchId } = this
    // TouchEvent
    if (touchId !== null && (event as TouchEvent).changedTouches) {
      const touchEvent = event as TouchEvent
      for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
        const touch = touchEvent.changedTouches[i]
        if (touch.identifier === touchId) {
          return {
            x: touch.clientX,
            y: touch.clientY
          }
        }
      }

      return null
    }

    // MouseEvent
    return {
      x: (event as MouseEvent).clientX,
      y: (event as MouseEvent).clientY
    }
  }
}

export function createThumbDOM(element: HTMLElement | null | undefined, options?: ThumbDOMOptions) {
  return new ThumbDOM(element, options)
}
