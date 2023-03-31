import {
  Axis,
  axis as axisMiddleware,
  compose,
  Coords,
  CoordsLimit,
  createThumbDOM,
  isEqualCoords,
  limit as limitMiddleware,
  Middleware,
  ThumbDOM,
  ThumbDOMOptions
} from '@fantasy-thumb/base'
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface UseThumbDOMProps extends Omit<ThumbDOMOptions, 'onChange'> {
  axis?: Axis
  min?: CoordsLimit | number
  max?: CoordsLimit | number
}

export interface UseThumbDOMReturn extends Pick<ThumbDOM, 'setCoords'> {
  coords: Coords
  dragging: boolean
  setThumbElement: (node: HTMLElement | null | undefined) => void
}

export function useThumbDOM(props: UseThumbDOMProps): UseThumbDOMReturn {
  const {
    disabled = false,
    axis = 'x',
    min,
    max,
    buttons,
    middleware: userMiddleware,
    onDragStart,
    onDragging,
    onDragEnd
  } = props

  const thumbElementRef = useRef<HTMLElement | null | undefined>()
  const propsRef = useRef() as MutableRefObject<
    Omit<UseThumbDOMProps, 'disabled' | 'middleware' | 'buttons'>
  >

  const [thumbDOM] = useState(() =>
    createThumbDOM(null, null, {
      onChange(nextCoords) {
        setCoords((coords) => {
          if (!isEqualCoords(coords, nextCoords)) {
            return nextCoords
          }
          return coords
        })
      },
      onDragStart(...args) {
        setDragging(true)
        return propsRef.current.onDragStart?.(...args)
      },
      onDragging(...args) {
        propsRef.current.onDragging?.(...args)
      },
      onDragEnd(...args) {
        setDragging(false)
        propsRef.current.onDragEnd?.(...args)
      }
    })
  )

  const setThumbElement = useCallback((node: HTMLElement | null | undefined) => {
    thumbElementRef.current = node
    thumbDOM.registerThumbElement(node)
  }, [])

  useEffect(() => {
    return () => {
      thumbDOM.unregisterThumbElement()
    }
  }, [])

  const [coords, setCoords] = useState(() => thumbDOM.getCoords())
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    propsRef.current = {
      axis,
      min,
      max,
      onDragStart,
      onDragging,
      onDragEnd
    }
  }, [axis, min, max, onDragStart, onDragging, onDragEnd])

  useEffect(() => {
    thumbDOM.setOptions({
      disabled,
      buttons
    })
  }, [disabled, buttons])

  const [middleware] = useState(() => {
    return compose(
      axisMiddleware(() => propsRef.current.axis),
      limitMiddleware(() => ({
        min: propsRef.current.min,
        max: propsRef.current.max
      }))
    )
  })

  useEffect(() => {
    thumbDOM.setOptions({
      middleware: compose(...([userMiddleware, middleware].filter(Boolean) as Middleware[]))
    })
  }, [userMiddleware])

  return useMemo(
    () => ({
      setThumbElement,
      coords,
      dragging,
      setCoords: (position) => thumbDOM.setCoords(position)
    }),
    [coords, dragging]
  )
}
