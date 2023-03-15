import { ChangeCallback, isEqualCoords, PartialCoords } from '@thumb-fantasy/base'
import React, { useCallback } from 'react'
import { useThumbDOM, UseThumbDOMProps } from './hooks/useThumbDOM'
import { ThumbContext, ThumbContextValue } from './ThumbContext'

export interface ThumbProps extends UseThumbDOMProps {
  coords?: PartialCoords
  defaultCoords?: PartialCoords
  autoRef?: boolean
  onChange?: ChangeCallback
}

export const Thumb = (
  props: ThumbProps & {
    children?: React.ReactNode
  }
) => {
  const {
    coords: userCoords,
    defaultCoords: userDefaultCoords,
    autoRef = true,
    children,
    onChange,
    ...useThumbDOMProps
  } = props

  const { setThumbElement, coords, setCoords, dragging } = useThumbDOM(useThumbDOMProps)
  const coordsRef = React.useRef(coords)

  const [mergedCoords, setMergedCoords] = React.useState<PartialCoords>()

  React.useEffect(() => {
    const nextMergedCoords = userCoords === undefined ? userCoords : userDefaultCoords
    if (!isEqualCoords(mergedCoords, nextMergedCoords)) {
      setMergedCoords(nextMergedCoords)
    }
  }, [userCoords])

  React.useEffect(() => {
    if (mergedCoords && !isEqualCoords(coordsRef.current, mergedCoords)) {
      setCoords(mergedCoords)
    }
  }, [mergedCoords])

  React.useEffect(() => {
    coordsRef.current = coords
    if (!isEqualCoords(userCoords, coords)) {
      onChange?.(coords)
    }
  }, [coords])

  const publicSetThumbElement = useCallback<typeof setThumbElement>(
    (element) => {
      if (!autoRef) {
        setThumbElement(element)
      }
    },
    [autoRef, setThumbElement]
  )

  const thumbContextValue = React.useMemo<ThumbContextValue>(
    () => ({
      ...coords,
      dragging,
      setThumbElement: publicSetThumbElement
    }),
    [coords, dragging, publicSetThumbElement]
  )

  return (
    <ThumbContext.Provider value={thumbContextValue}>
      {React.isValidElement(children) &&
        (autoRef
          ? React.cloneElement<any>(children, {
              ref: setThumbElement
            })
          : children)}
    </ThumbContext.Provider>
  )
}
