import { DraggingEnvironmentCreator, Position, Thumb } from '../src'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

function App() {
  const [position, setPosition] = useState<Position>()

  const createDraggingEnvironment: DraggingEnvironmentCreator = (position, element) => {
    const { top, left } = element.getBoundingClientRect()
    return {
      offset: {
        x: position.x - left,
        y: position.y - top
      }
    }
  }

  return (
    <Thumb
      id='thumb'
      position={position}
      defaultPosition={{
        x: 20,
        y: 20
      }}
      draggingClassName='dragging'
      style={{
        top: `${position?.y || 0}px`,
        left: `${position?.x || 0}px`
      }}
      createDraggingEnvironment={createDraggingEnvironment}
      onChange={(newPosition) => setPosition(newPosition)}
    />
  )
}

const root = createRoot(document.getElementById('app')!)

root.render(<App />)
