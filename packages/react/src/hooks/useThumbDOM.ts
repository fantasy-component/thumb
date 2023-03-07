import { createThumbDOM, Position, ThumbDOM, ThumbDOMOptions } from '@thumb-fantasy/base'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

  const callbacks = useRef<Pick<UseThumbDOMProps, 'onDragStart' | 'onDragging' | 'onDragEnd'>>()

  const thumb = useRef<HTMLElement | null>(null)
  const [thumbDOM] = useState(() => createThumbDOM())

  const [position, setPosition] = useState(thumbDOM.getPosition())
  const [dragging, setDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState<Position>()

  useEffect(() => {
    callbacks.current = {
      onDragStart,
      onDragEnd,
      onDragging
    }
  }, [onDragStart, onDragEnd, onDragging])

  useEffect(() => {
    thumbDOM.setOptions({
      onPositionChange(finger) {
        setPosition(finger)
        setDragDistance(thumbDOM.getDragDistance())
      },
      onDragStart(finger, event) {
        setDragging(true)
        callbacks.current!.onDragStart?.(finger, thumb.current!, event)
      },
      onDragging(finger, event) {
        callbacks.current!.onDragging?.(finger, thumb.current!, event)
      },
      onDragEnd(finger, event) {
        setDragging(false)
        callbacks.current!.onDragEnd?.(finger, thumb.current!, event)
      }
    })
  }, [])

  useEffect(() => {
    thumbDOM.setDisabled(!!disabled)
  }, [disabled])

  useEffect(() => {
    thumbDOM.setOptions({
      direction,
      min,
      max,
      createDraggingEnvironment
    })
  }, [direction, min, max, createDraggingEnvironment])

  const setThumb = useCallback((node: HTMLElement | null) => {
    thumbDOM.registerThumbElement(node)
  }, [])

  return useMemo(
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
