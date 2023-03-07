import * as React from 'react'
import { DraggingData } from './interface'

export interface ThumbContextValue extends DraggingData {}

export const ThumbContext = React.createContext<ThumbContextValue | null>(null)
