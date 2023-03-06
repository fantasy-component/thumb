import { createThumb, Position, PositionChangeCallback, Thumb, ThumbOptions } from './Thumb'

export const BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
} as const

function isAllowedButtonType(event: MouseEvent, buttons: number[]) {
  return buttons.includes(event.button)
}

function ownerDocument(node: Node | null | undefined): Document {
  return node?.ownerDocument || document
}

export interface DraggingEnvironment {
  disabled?: boolean
  offset?: Position
}

export type DraggingEnvironmentCreator = (
  finger: Position,
  element: HTMLElement,
  event: TouchEvent | MouseEvent
) => DraggingEnvironment | null | undefined

export type DraggingCallback = (finger: Position, event: TouchEvent | MouseEvent) => void

export interface ThumbDOMOptions extends Omit<ThumbOptions, 'onChange'> {
  disabled?: boolean
  /**
   * Allowed button types
   * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
   */
  buttons?: number[]
  /**
   * Create an environment for dragging startup, only run on drag-start
   */
  createDraggingEnvironment?: DraggingEnvironmentCreator
  onPositionChange?: PositionChangeCallback
  onDragStart?: DraggingCallback
  onDragging?: DraggingCallback
  onDragEnd?: DraggingCallback
}

const defaultOptions = {
  disabled: false,
  direction: 'horizontal',
  buttons: [BUTTONS.LEFT] as any[]
} as const

export class ThumbDOM {
  private thumb: Thumb

  private thumbElement: HTMLElement | null | undefined = null
  private touchId: number | null = null
  private offset: Position | null | undefined = null

  private options!: Required<Pick<ThumbDOMOptions, keyof typeof defaultOptions>> & ThumbDOMOptions

  constructor(element?: HTMLElement | null, options?: ThumbDOMOptions) {
    this.thumb = createThumb(null)
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
      ...this.options,
      ...options
    })

    this.setDisabled(!!disabled)

    this.thumb.setOptions({ direction, min, max })
  }

  get disabled() {
    return this.options.disabled
  }

  setDisabled(disabled: boolean) {
    const { options } = this
    if (options.disabled !== disabled) {
      options.disabled = disabled

      if (disabled) {
        this.stopDragListening()
        this.thumb.terminateMove()
      }
    }
  }

  getPosition() {
    return this.thumb.getPosition()
  }

  setPosition(position: Position, quiet?: boolean) {
    const value = this.thumb.setPosition(position, quiet)
    if (value && !quiet) {
      this.handleChange(value)
    }

    return value
  }

  refreshPosition() {
    this.thumb.refreshPosition()
  }

  getDragDistance() {
    return this.thumb.getMoveDistance()
  }

  registerThumbElement(element: HTMLElement | null | undefined) {
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
    this.options.onPositionChange?.(position)
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

  private offsetPosition({ x, y }: Position) {
    const { offset } = this

    if (offset) {
      if (x !== undefined && offset.x !== undefined) {
        x -= offset.x
      }
      if (y !== undefined && offset.y !== undefined) {
        y -= offset.y
      }
    }

    return {
      x,
      y
    }
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

    const environment = this.options.createDraggingEnvironment?.(finger, this.thumbElement!, event)
    if (environment) {
      if (environment.disabled) {
        return
      }

      if (environment.offset) {
        this.offset = environment.offset
      }
    }

    this.options.onDragStart?.(finger, event)

    const actualPosition = this.offsetPosition(finger)
    const newPosition = this.thumb.move(actualPosition)

    if (newPosition) {
      this.handleChange(newPosition)
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

    this.options.onDragging?.(finger, event)

    const actualPosition = this.offsetPosition(finger)
    const newPosition = this.thumb.move(actualPosition)

    if (newPosition) {
      this.handleChange(newPosition)
    }
  }

  private handleTouchEnd(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    this.options.onDragEnd?.(finger, event)

    const actualPosition = this.offsetPosition(finger)
    const newPosition = this.thumb.move(actualPosition)

    this.touchId = null

    if (newPosition) {
      this.handleChange(newPosition)
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
    if (!isAllowedButtonType(event, options.buttons)) {
      return
    }

    // Avoid text selection
    event.preventDefault()

    const finger = this.trackFinger(event)!

    const environment = this.options.createDraggingEnvironment?.(finger, this.thumbElement!, event)
    if (environment) {
      if (environment.disabled) {
        return
      }

      if (environment.offset) {
        this.offset = environment.offset
      }
    }

    options.onDragStart?.(finger, event)

    const actualPosition = this.offsetPosition(finger)
    const newPosition = this.thumb.move(actualPosition)

    if (newPosition) {
      this.handleChange(newPosition)
    }

    const doc = ownerDocument(this.thumbElement)
    doc.addEventListener('mousemove', this.handleTouchMove)
    doc.addEventListener('mouseup', this.handleTouchEnd)
  }
}

export function createThumbDOM(
  element?: HTMLElement | null,
  position?: Position | null,
  options?: ThumbDOMOptions
) {
  const thumbDOM = new ThumbDOM(element, options)

  if (position) {
    thumbDOM.setPosition(position, true)
  }

  return thumbDOM
}
