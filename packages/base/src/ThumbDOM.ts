import { ChangeCallback, createThumb, Thumb, ThumbOptions, ThumbPayload } from './Thumb'
import { Coords, Middleware, PartialCoords } from './types'
import { compose } from './utils/compose'

export const DOMCoordsChangeType = {
  MANUAL: 'manual',
  DRAG_START: 'drag-start',
  DRAGGING: 'dragging',
  DRAG_END: 'drag-end'
} as const
export type DOMCoordsChangeType = typeof DOMCoordsChangeType[keyof typeof DOMCoordsChangeType]

interface ManualPayload {
  readonly type: 'manual'
  readonly element?: HTMLElement
}

interface DragPayload {
  readonly type: Exclude<DOMCoordsChangeType, ManualPayload['type']>
  readonly element: HTMLElement
  readonly event: TouchEvent | MouseEvent
}

export interface ThumbDOMPayload extends ThumbPayload {
  dom: ManualPayload | DragPayload
}

export const BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
} as const

function ownerDocument(node: Node | null | undefined): Document {
  return node?.ownerDocument || document
}

function isAllowedButtonType(event: MouseEvent, buttons: number[]) {
  return buttons.includes(event.button)
}

export type DraggingCallback<T = void> = (
  coords: Coords,
  element: HTMLElement,
  event: TouchEvent | MouseEvent
) => T

export interface ThumbDOMOptions extends Omit<ThumbOptions, 'middleware' | 'onChange'> {
  /**
   * Whether to disable dragging.
   */
  disabled?: boolean
  /**
   * Allows to control the change of coords through the form of middleware.
   */
  middleware?: Middleware<ThumbDOMPayload>
  /**
   * Allowed button types.
   * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
   */
  buttons?: number[]
  /**
   * The callback function when the coords changes.
   * Maybe change actively, or it is possibly caused by dragging.
   */
  onChange?: ChangeCallback
  /**
   * The callback function before dragging starts.
   * If it returns `false`, the dragging will not start.
   */
  onDragStart?: DraggingCallback<boolean | void>
  /**
   * The callback function when dragging.
   */
  onDragging?: DraggingCallback
  /**
   * The callback function before dragging ends.
   */
  onDragEnd?: DraggingCallback
}

const defaultOptions = {
  disabled: false,
  buttons: [BUTTONS.LEFT]
} as const

export class ThumbDOM {
  private thumb: Thumb
  private thumbElement: HTMLElement | null | undefined = null
  private touchId: number | null = null
  private payload!: ManualPayload | DragPayload

  private options!: Required<Pick<ThumbDOMOptions, keyof typeof defaultOptions>> & ThumbDOMOptions

  constructor(element?: HTMLElement | null, options?: ThumbDOMOptions) {
    this.thumb = createThumb(null, {
      onChange: (coords) => this.options.onChange?.(coords)
    })

    this.setOptions(options)

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    if (element) {
      this.registerThumbElement(element)
    }
  }

  setOptions(partialOptions: ThumbDOMOptions = {}) {
    const { options } = this
    const { disabled, middleware } = (this.options = {
      ...defaultOptions,
      ...options,
      ...partialOptions,
      buttons: partialOptions.buttons || options?.buttons || defaultOptions.buttons
    })

    this.setDisabled(!!disabled)

    const middlewares = [this.createDOMMiddlewarePayloadSupplements(), middleware].filter(
      Boolean
    ) as Middleware[]
    this.thumb.setOptions({
      middleware: compose(...middlewares)
    })
  }

  private createDOMMiddlewarePayloadSupplements(): Middleware<ThumbPayload, ThumbDOMPayload> {
    return (payload) => {
      return {
        ...payload,
        dom: this.payload
      }
    }
  }

  private setPayload(type: DOMCoordsChangeType, event?: TouchEvent | MouseEvent) {
    this.payload = {
      type,
      element: this.thumbElement!,
      event
    } as any
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
      }
    }
  }

  getCoords() {
    return this.thumb.getCoords()
  }

  setCoords(coords: PartialCoords, quiet?: boolean) {
    this.setPayload(DOMCoordsChangeType.MANUAL)
    return this.thumb.setCoords(coords, quiet)
  }

  getThumbElement() {
    return this.thumbElement
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

  private handleTouchStart(event: TouchEvent) {
    if (this.disabled) {
      return
    }

    const touch = event.changedTouches[0]
    if (touch) {
      this.touchId = touch.identifier
    }

    const finger = this.trackFinger(event)!

    const enableDrag = this.options.onDragStart?.(finger, this.thumbElement!, event)
    if (enableDrag === false) {
      return
    }

    this.setPayload(DOMCoordsChangeType.DRAG_START, event)
    this.thumb.setCoords(finger)

    const doc = ownerDocument(this.thumbElement)
    doc.addEventListener('touchmove', this.handleTouchMove)
    doc.addEventListener('touchend', this.handleTouchEnd)
  }

  private handleTouchMove(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    this.options.onDragging?.(finger, this.thumbElement!, event)

    this.setPayload(DOMCoordsChangeType.DRAGGING, event)
    this.thumb.setCoords(finger)
  }

  private handleTouchEnd(event: TouchEvent | MouseEvent) {
    const finger = this.trackFinger(event)
    if (!finger) {
      return
    }

    this.setPayload(DOMCoordsChangeType.DRAG_END, event)
    this.thumb.setCoords(finger)

    this.touchId = null

    this.options.onDragEnd?.(finger, this.thumbElement!, event)

    this.stopDragListening()
  }

  private handleMouseDown(event: MouseEvent) {
    if (
      this.disabled ||
      event.defaultPrevented ||
      !isAllowedButtonType(event, this.options.buttons)
    ) {
      return
    }

    // Avoid text selection
    event.preventDefault()

    const finger = this.trackFinger(event)!

    const enableDrag = this.options.onDragStart?.(finger, this.thumbElement!, event)
    if (enableDrag === false) {
      return
    }

    this.setPayload(DOMCoordsChangeType.DRAG_START, event)
    this.thumb.setCoords(finger)

    const doc = ownerDocument(this.thumbElement)
    doc.addEventListener('mousemove', this.handleTouchMove)
    doc.addEventListener('mouseup', this.handleTouchEnd)
  }

  private trackFinger(event: TouchEvent | MouseEvent) {
    const { touchId } = this
    // TouchEvent
    if (touchId !== null && (event as TouchEvent).changedTouches) {
      const touchEvent = event as TouchEvent

      for (let i = 0; i < touchEvent.changedTouches.length; i++) {
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

export function createThumbDOM(
  element?: HTMLElement | null,
  coords?: PartialCoords | null,
  options?: ThumbDOMOptions
) {
  const thumbDOM = new ThumbDOM(element, options)

  if (coords) {
    thumbDOM.setCoords(coords, true)
  }

  return thumbDOM
}
