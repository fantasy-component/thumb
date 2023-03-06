import { createThumbDOM, Position, ThumbDOM, ThumbDOMOptions } from '@thumb-fantasy/base'
import * as React from 'react'

export type DraggingCallback = (
  position: Position,
  element: HTMLElement,
  event: TouchEvent | MouseEvent
) => void

export interface UseThumbDOMProps
  extends Omit<ThumbDOMOptions, 'onPositionChange' | 'onDragStart' | 'onDragging' | 'onDragEnd'> {
  onDragStart?: DraggingCallback
  onDragging?: DraggingCallback
  onDragEnd?: DraggingCallback
}

export interface UseThumbDOMReturn extends Pick<ThumbDOM, 'setPosition'> {
  position: React.MutableRefObject<Position>
  dragging: boolean
  dragDistance: Position | undefined
}

export function useThumbDOM(
  element: HTMLElement | null | undefined,
  props: UseThumbDOMProps
): UseThumbDOMReturn {
  const {
    disabled,
    direction = 'horizontal',
    min,
    max,
    createDraggingEnvironment,
    onDragStart,
    onDragging,
    onDragEnd
  } = props

  const [thumbDOM] = React.useState(() => {
    return createThumbDOM()
  })

  const position = React.useRef(thumbDOM.getPosition())
  const [dragging, setDragging] = React.useState(false)
  const [dragDistance, setDragDistance] = React.useState<Position>()

  React.useEffect(() => {
    thumbDOM.registerThumbElement(element)

    return () => thumbDOM.unregisterThumbElement()
  }, [element])

  React.useEffect(() => {
    thumbDOM.setOptions({
      direction,
      min,
      max,
      createDraggingEnvironment,
      onPositionChange(finger) {
        position.current = finger
        setDragDistance(thumbDOM.getDragDistance())
      },
      onDragStart(finger, event) {
        setDragging(true)

        onDragStart?.(finger, element!, event)
      },
      onDragging(finger, event) {
        onDragging?.(finger, element!, event)
      },
      onDragEnd(finger, event) {
        setDragging(false)

        onDragEnd?.(finger, element!, event)
      }
    })
  }, [direction, min, max, createDraggingEnvironment, onDragStart, onDragEnd, onDragging])

  React.useEffect(() => {
    thumbDOM.setDisabled(!!disabled)
  }, [disabled])

  return {
    position,
    setPosition: (position) => thumbDOM.setPosition(position),
    dragging,
    dragDistance
  }
}
