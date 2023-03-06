import {
  createThumb,
  Direction,
  Position,
  PositionChangeCallback,
  PositionLimits,
  Thumb
} from './Thumb'

function ownerDocument(node: Node | null | undefined): Document {
  return node?.ownerDocument || document
}

export const BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
} as const

type DragStartCallback = (event: TouchEvent | MouseEvent) => void
type DraggingCallback = (event: TouchEvent | MouseEvent) => void
type DragEndCallback = (event: TouchEvent | MouseEvent) => void

export interface ThumbDOMOptions {
  disabled?: boolean
  direction?: Direction
  min?: number | PositionLimits
  max?: number | PositionLimits
  buttons?: number[]
  // happens at drag-start
  getDraggingOffset?: (position: Position, event: TouchEvent | MouseEvent) => Position
  onChange?: PositionChangeCallback
  onDragStart?: DragStartCallback
  onDragging?: DraggingCallback
  onDragEnd?: DragEndCallback
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

  getPosition() {
    return this.thumb.getPosition()
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

    const { options } = this

    options.onDragStart?.(event)

    const finger = this.trackFinger(event)
    if (finger) {
      const offset = options.getDraggingOffset?.(finger, event)
      const fingerValue = finger && this.thumb.move(finger, offset)

      if (fingerValue) {
        this.handleChange(fingerValue)
      }
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

    const fingerValue = this.thumb.move(finger)

    if (!this.dragging) {
      this.dragging = true
    }

    this.options.onDragging?.(event)

    if (fingerValue) {
      this.handleChange(fingerValue)
    }
  }

  private handleTouchEnd(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    const fingerValue = this.thumb.move(finger)

    this.dragging = false
    this.touchId = null

    this.options.onDragEnd?.(event)

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
    if (!this.options.buttons.includes(event.button)) {
      return
    }

    options.onDragStart?.(event)

    // Avoid text selection
    event.preventDefault()

    const finger = this.trackFinger(event)
    if (finger) {
      const offset = options.getDraggingOffset?.(finger, event)
      const fingerValue = this.thumb.move(finger, offset)

      if (fingerValue) {
        this.handleChange(fingerValue)
      }
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
