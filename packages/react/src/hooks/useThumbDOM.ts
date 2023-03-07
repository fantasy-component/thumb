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
  thumb: (node: HTMLElement | null) => void
  position: Position
  dragging: boolean
  dragDistance: Position | undefined
}

export function useThumbDOM(props: UseThumbDOMProps): UseThumbDOMReturn {
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

  const thumb = React.useRef<HTMLElement | null>(null)
  const [thumbDOM] = React.useState(() => {
    return createThumbDOM()
  })

  const [position, setPosition] = React.useState(thumbDOM.getPosition())
  const [dragging, setDragging] = React.useState(false)
  const [dragDistance, setDragDistance] = React.useState<Position>()

  React.useEffect(() => {
    thumbDOM.setOptions({
      direction,
      min,
      max,
      createDraggingEnvironment,
      onPositionChange(finger) {
        setPosition(finger)
        setDragDistance(thumbDOM.getDragDistance())
      },
      onDragStart(finger, event) {
        setDragging(true)
        onDragStart?.(finger, thumb.current!, event)
      },
      onDragging(finger, event) {
        onDragging?.(finger, thumb.current!, event)
      },
      onDragEnd(finger, event) {
        setDragging(false)
        onDragEnd?.(finger, thumb.current!, event)
      }
    })
  }, [direction, min, max, createDraggingEnvironment, onDragStart, onDragEnd, onDragging])

  React.useEffect(() => {
    thumbDOM.setDisabled(!!disabled)
  }, [disabled])

  const setThumb = React.useCallback((node: HTMLElement | null) => {
    thumbDOM.registerThumbElement(node)
  }, [])

  return React.useMemo(
    () => ({
      thumb: setThumb,
      position,
      dragging,
      dragDistance,
      setPosition: (position) => thumbDOM.setPosition(position)
    }),
    [position, dragging, dragDistance]
  )
}
