import { createContext } from 'vue-lib-toolkit'
import { DraggingData } from './interface'

export interface ThumbContextValue extends DraggingData {
  setThumbElement: (element: HTMLElement | null | undefined) => void
}

export const ThumbContext = createContext<ThumbContextValue | null>(null)
