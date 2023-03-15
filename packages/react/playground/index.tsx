import { Coords, Thumb, DraggingCallback, PartialCoords, offset as offsetMiddleware } from '../src'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { ThumbContext } from '../src/ThumbContext'

const Round = React.forwardRef<any>((props, ref) => {
  return (
    <ThumbContext.Consumer>
      {(draggingData) => (
        <div
          ref={ref}
          id='thumb'
          className={draggingData?.dragging ? 'dragging' : ''}
          style={{
            top: `${draggingData?.y || 0}px`,
            left: `${draggingData?.x || 0}px`
          }}
        />
      )}
    </ThumbContext.Consumer>
  )
})

function App() {
  const [coords, setCoords] = React.useState<Coords>()
  const [type, setType] = React.useState<string>('props')
  const offsetRef = React.useRef<PartialCoords>()

  const [middleware] = React.useState(() => offsetMiddleware(() => offsetRef.current))

  const onDragStart = React.useCallback<DraggingCallback>((coords, element) => {
    const { top, left } = element.getBoundingClientRect()
    offsetRef.current = {
      x: coords.x - left,
      y: coords.y - top
    }
  }, [])

  const onDragEnd = React.useCallback<DraggingCallback>(() => {
    offsetRef.current = undefined
  }, [])

  return (
    <React.Fragment>
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
        coords={coords}
        defaultCoords={{
          x: 200
        }}
        middleware={middleware}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onChange={(newCoords) => setCoords(newCoords)}
      >
        {type === 'props' ? (
          <div
            id='thumb'
            style={{
              top: `${coords?.y || 0}px`,
              left: `${coords?.x || 0}px`
            }}
          />
        ) : (
          <Round />
        )}
      </Thumb>
    </React.Fragment>
  )
}

const root = createRoot(document.getElementById('app')!)

root.render(<App />)
