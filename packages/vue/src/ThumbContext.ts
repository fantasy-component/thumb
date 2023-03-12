import { createContext } from 'vue-lib-toolkit'
import { DraggingData } from './interface'

export interface ThumbContextValue extends DraggingData {}

export const ThumbContext = createContext<ThumbContextValue | null>(null)
