import { createApp, defineComponent, ref } from 'vue'
import { DraggingContextCreator, Position, Thumb } from '../src'
import { ThumbContext } from '../src/ThumbContext'

const Round = defineComponent({
  name: 'Round',

  render() {
    return (
      <ThumbContext.Consumer>
        {{
          default: (thumbContext) => (
            <div
              id='thumb'
              class={thumbContext?.dragging ? 'dragging' : ''}
              style={{
                top: `${thumbContext?.position?.y || 0}px`,
                left: `${thumbContext?.position?.x || 0}px`
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
    const position = ref<Position>()
    const type = ref('props')

    const createDraggingContext: DraggingContextCreator = (position, element) => {
      const { top, left } = element.getBoundingClientRect()
      return {
        offset: {
          x: position.x - left,
          y: position.y - top
        }
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
            position={position.value}
            defaultPosition={{
              x: 200
            }}
            createDraggingContext={createDraggingContext}
            onChange={(newPosition) => (position.value = newPosition)}
          >
            {{
              default: () =>
                type.value === 'props' ? (
                  <div
                    id='thumb'
                    style={{
                      top: `${position.value?.y || 0}px`,
                      left: `${position.value?.x || 0}px`
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
