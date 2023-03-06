import { Position } from '@thumb-fantasy/base'
import clsx from 'clsx'
import * as React from 'react'
import { useThumbDOM, UseThumbDOMProps } from './hooks/useThumbDOM'

export type ChangeCallback = (position: Position, dragDistance?: Position) => void

export interface ThumbProps extends UseThumbDOMProps {
  id?: string
  position?: Position
  defaultPosition?: Position
  className?: string
  draggingClassName?: string
  style?: React.CSSProperties
  onChange?: ChangeCallback
}

export interface DraggingData {
  position: Position
  dragging: boolean
  dragDistance: Position | undefined
}

export interface ThumbExposed {
  getDraggingData(): DraggingData
}

export const Thumb = React.forwardRef<
  ThumbExposed,
  ThumbProps & {
    children?: React.ReactNode
  }
>((inputProps, ref) => {
  const {
    id,
    position: userPosition,
    defaultPosition: userDefaultPosition,
    className,
    draggingClassName = 'thumb-dragging',
    style,
    onChange,
    children,
    ...useThumbProps
  } = inputProps

  const [mergedPosition] = React.useState(
    userPosition !== undefined ? userPosition : userDefaultPosition
  )

  const thumbElementRef = React.useRef(null)
  const { position, setPosition, dragging, dragDistance } = useThumbDOM(
    thumbElementRef.current,
    useThumbProps
  )

  React.useEffect(() => {
    if (mergedPosition) {
      setPosition(mergedPosition)
    }
  }, [mergedPosition])

  React.useEffect(() => {
    onChange?.(position.current, dragDistance)
  }, [position.current])

  React.useImperativeHandle(
    ref,
    () => {
      return {
        getDraggingData() {
          return {
            position: position.current,
            dragging,
            dragDistance
          }
        }
      }
    },
    [dragging, dragDistance]
  )

  return (
    <div
      ref={thumbElementRef}
      id={id}
      className={clsx(className, dragging && draggingClassName)}
      style={style}
    ></div>
  )
})
