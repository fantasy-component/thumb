import { computed, defineComponent, ExtractPropTypes, h, PropType, ref, watch } from 'vue'
import { useMergedState } from 'vue-reactivity-fantasy'
import { Position, PositionChangeCallback } from '@thumb-fantasy/base'
import { useThumbDOM, UseThumbDOMCallbackProps, UseThumbDOMProps } from '../composables/useThumbDOM'

export type ChangeCallback = (position: Position, dragDistance?: Position) => void
export type DraggingChangeCallback = (dragging: boolean) => void

const ThumbProps = {
  ...UseThumbDOMProps,
  ...UseThumbDOMCallbackProps,
  position: Object as PropType<Position>,
  defaultPosition: Object as PropType<Position>,
  draggingClass: {
    type: [String, Array, Object] as PropType<any>,
    default: 'thumb-dragging'
  },
  onChange: Function as PropType<ChangeCallback>,
  'onUpdate:position': Function as PropType<PositionChangeCallback>
} as const

export type ThumbProps = ExtractPropTypes<typeof ThumbProps>

export interface DraggingData {
  position: Position
  dragging: boolean
  dragDistance?: Position
}

export interface ThumbSlotProps extends DraggingData {}

export interface ThumbExposed {
  getDraggingData(): DraggingData
}

export const Thumb = defineComponent({
  name: 'Thumb',

  props: ThumbProps,

  setup(props, { slots, emit, expose }) {
    const thumbElement = ref<HTMLElement>()

    // TODO: refactor it, Vue2 can't extract event callback function from props
    const { position, dragging, dragDistance, setPosition } = useThumbDOM(thumbElement, props, {
      onDragStart(event, position) {
        emit('drag-start', event, position)
      },
      onDragging(event, position) {
        emit('dragging', event, position)
      },
      onDragEnd(event, position) {
        emit('drag-end', event, position)
      }
    })

    const draggingData = computed(() => {
      return {
        position: position.value,
        dragging: dragging.value,
        dragDistance: dragDistance.value
      }
    })

    const mergedPosition = useMergedState(
      () => props.position,
      () => props.defaultPosition
    )

    watch(
      mergedPosition,
      (position) => {
        if (position) {
          setPosition(position)
        }
      },
      {
        immediate: true
      }
    )

    watch(
      position,
      (position) => {
        emit('change', position, dragDistance.value)
        emit('update:position', position)
      },
      {
        immediate: true
      }
    )

    expose(<ThumbExposed>{
      getDraggingData() {
        return draggingData.value
      }
    })

    return () => {
      return h(
        'div',
        {
          ref: thumbElement,
          class: dragging.value && props.draggingClass
        },
        slots.default?.(draggingData.value)
      )
    }
  }
})
