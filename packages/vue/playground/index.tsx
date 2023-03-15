import { createApp, defineComponent, ref } from 'vue'
import { Coords, Thumb, DraggingCallback, PartialCoords, offset as offsetMiddleware } from '../src'
import { ThumbContext } from '../src/ThumbContext'

const Round = defineComponent({
  name: 'Round',

  render() {
    return (
      <ThumbContext.Consumer>
        {{
          default: (thumbContextValue) => (
            <div
              id='thumb'
              class={thumbContextValue?.dragging ? 'dragging' : ''}
              style={{
                top: `${thumbContextValue?.y || 0}px`,
                left: `${thumbContextValue?.x || 0}px`
              }}
            ></div>
          )
        }}
      </ThumbContext.Consumer>
    )
  }
})

const App = defineComponent({
  name: 'App',

  setup() {
    const coords = ref<Coords>()
    const offset = ref<PartialCoords>()
    const type = ref('props')

    const middleware = offsetMiddleware(() => offset.value)

    const handleDragStart: DraggingCallback = (coords, element) => {
      const { top, left } = element.getBoundingClientRect()
      offset.value = {
        x: coords.x - left,
        y: coords.y - top
      }
    }

    return () => {
      return (
        <div>
          <div>
            <label>
              <input
                type='radio'
                id='props'
                name='child'
                value='props'
                checked={type.value === 'props'}
                onChange={(event) => event.isTrusted && (type.value = 'props')}
              />
              props
            </label>
            <label>
              <input
                type='radio'
                name='child'
                value='context'
                checked={type.value === 'context'}
                onChange={(event) => event.isTrusted && (type.value = 'context')}
              />
              context
            </label>
          </div>

          <Thumb
            coords={coords.value}
            defaultCoords={{
              x: 200
            }}
            middleware={middleware}
            onDragStart={handleDragStart}
            onChange={(newCoords) => (coords.value = newCoords)}
          >
            {{
              default: () =>
                type.value === 'props' ? (
                  <div
                    id='thumb'
                    style={{
                      top: `${coords.value?.y || 0}px`,
                      left: `${coords.value?.x || 0}px`
                    }}
                  />
                ) : (
                  <Round />
                )
            }}
          </Thumb>
        </div>
      )
    }
  }
})

createApp(App).mount('#app')
