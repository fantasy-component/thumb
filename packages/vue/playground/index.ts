import { createApp, h, ref } from 'vue'
import { Position, Thumb } from '../src'

createApp({
  setup() {
    const position = ref<Position>()

    return () => {
      return h(Thumb, {
        id: 'thumb',
        style: {
          top: `${position.value?.y || 0}px`,
          left: `${position.value?.x || 0}px`
        },
        position: position.value,
        defaultPosition: {
          x: 20,
          y: 20
        },
        draggingClass: 'dragging',
        'onUpdate:position': (value) => {
          position.value = value
        },
        getOffset(position, element) {
          const { top, left } = element.getBoundingClientRect()
          return {
            x: position.x - left,
            y: position.y - top
          }
        }
      })
    }
  }
}).mount('#app')
