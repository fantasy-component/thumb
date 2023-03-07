import { DraggingEnvironmentCreator, Position, Thumb } from '../src'
import { createRoot } from 'react-dom/client'
import { forwardRef, Fragment, useCallback, useState } from 'react'
import { ThumbContext } from '../src/ThumbContext'

const Round = forwardRef<any>((props, ref) => {
  return (
    <ThumbContext.Consumer>
      {(draggingData) => (
        <div
          ref={ref}
          id='thumb'
          className={draggingData?.dragging ? 'dragging' : ''}
          style={{
            top: `${draggingData?.position?.y || 0}px`,
            left: `${draggingData?.position?.x || 0}px`
          }}
        />
      )}
    </ThumbContext.Consumer>
  )
})

function App() {
  const [position, setPosition] = useState<Position>()
  const [type, setType] = useState<string>('props')

  const createDraggingEnvironment: DraggingEnvironmentCreator = useCallback((position, element) => {
    const { top, left } = element.getBoundingClientRect()
    return {
      offset: {
        x: position.x - left,
        y: position.y - top
      }
    }
  }, [])

  return (
    <Fragment>
      <div>
        <label>
          <input
            type='radio'
            id='props'
            name='child'
            value='props'
            checked={type === 'props'}
            onChange={(event) => event.isTrusted && setType('props')}
          />
          props
        </label>
        <label>
          <input
            type='radio'
            name='child'
            value='context'
            checked={type === 'context'}
            onChange={(event) => event.isTrusted && setType('context')}
          />
          context
        </label>
      </div>

      <Thumb
        position={position}
        defaultPosition={{
          x: 200
        }}
        createDraggingEnvironment={createDraggingEnvironment}
        onChange={(newPosition) => setPosition(newPosition)}
      >
        {type === 'props' ? (
          <div
            id='thumb'
            style={{
              top: `${position?.y || 0}px`,
              left: `${position?.x || 0}px`
            }}
          />
        ) : (
          <Round />
        )}
      </Thumb>
    </Fragment>
  )
}

const root = createRoot(document.getElementById('app')!)

root.render(<App />)
