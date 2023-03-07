import { Position } from '@thumb-fantasy/base'
import {
  cloneElement,
  isValidElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useThumbDOM, UseThumbDOMProps } from './hooks/useThumbDOM'
import { DraggingData } from './interface'
import { ThumbContext } from './ThumbContext'

export type ChangeCallback = (position: Position, dragDistance?: Position) => void

export interface ThumbProps extends UseThumbDOMProps {
  position?: Position
  defaultPosition?: Position
  onChange?: ChangeCallback
}

export const Thumb = (
  props: ThumbProps & {
    children?: ReactNode
  }
) => {
  const {
    position: userPosition,
    defaultPosition: userDefaultPosition,
    onChange,
    children,
    ...useThumbDOMProps
  } = props

  const { thumb, position, setPosition, dragging, dragDistance } = useThumbDOM(useThumbDOMProps)

  const [mergedPosition] = useState(userPosition !== undefined ? userPosition : userDefaultPosition)

  useEffect(() => {
    if (mergedPosition) {
      setPosition(mergedPosition)
    }
  }, [mergedPosition])

  useEffect(() => {
    onChange?.(position, dragDistance)
  }, [position])

  const draggingData = useMemo<DraggingData>(
    () => ({
      position,
      dragging,
      dragDistance
    }),
    [position, dragging, dragDistance]
  )

  return (
    <ThumbContext.Provider value={draggingData}>
      {isValidElement(children) &&
        cloneElement<any>(children, {
          ref: thumb
        })}
    </ThumbContext.Provider>
  )
}
