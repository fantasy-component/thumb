import { Position } from '@thumb-fantasy/base'

export interface DraggingData {
  position: Position
  dragging: boolean
  dragDistance: Position | undefined
}
