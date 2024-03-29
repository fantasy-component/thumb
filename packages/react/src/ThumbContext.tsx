import * as React from 'react'
import { DraggingData } from './interface'

export interface ThumbContextValue extends DraggingData {
  setThumbElement: (element: HTMLElement | null | undefined) => void
}

export const ThumbContext = React.createContext<ThumbContextValue | null>(null)
