import {
  computed,
  defineComponent,
  ExtractPropTypes,
  getCurrentInstance,
  h,
  PropType,
  reactive,
  ref,
  watch,
  watchEffect
} from 'vue'
import { isVue2, useFirstQualifiedElement } from 'vue-lib-toolkit'
import { useMergedState } from 'vue-reactivity-fantasy'
import { Position, PositionChangeCallback } from '@thumb-fantasy/base'
import { useThumbDOM, UseThumbDOMProps } from './composables/useThumbDOM'
import { ThumbContext } from './ThumbContext'
import { DraggingData } from './interface'

export type ChangeCallback = (position: Position, dragDistance?: Position) => void

const ThumbProps = {
  ...UseThumbDOMProps,
  position: Object as PropType<Position>,
  defaultPosition: Object as PropType<Position>,
  onChange: Function as PropType<ChangeCallback>,
  'onUpdate:position': Function as PropType<PositionChangeCallback>
} as const

export type ThumbProps = ExtractPropTypes<typeof ThumbProps>

export interface ThumbSlotProps extends DraggingData {}

export interface ThumbExposed {
  getElement(): HTMLElement | null | undefined
  getDraggingData(): DraggingData
}

export const Thumb = defineComponent({
  name: 'Thumb',

  props: ThumbProps,

  setup(props, { slots, emit, expose }) {
    const thumbElement = useFirstQualifiedElement<HTMLElement>((element) => {
      return element?.nodeType === 1
    })

    let thumbDOMProps: UseThumbDOMProps = props

    if (isVue2) {
      // Vue2 can't extract event callback function from props
      thumbDOMProps = reactive<UseThumbDOMProps>({
        ...props,
        onDragStart: (event, position) => {
          emit('drag-start', event, position)
        },
        onDragging: (event, position) => {
          emit('drag-start', event, position)
        },
        onDragEnd: (event, position) => {
          emit('drag-start', event, position)
        }
      })

      watchEffect(() => {
        Object.assign(thumbDOMProps, props)
      })
    }

    const { position, dragging, dragDistance, setPosition } = useThumbDOM(
      thumbElement,
      thumbDOMProps
    )

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
      { immediate: true }
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
      getElement() {
        return thumbElement.value
      },
      getDraggingData() {
        return draggingData.value
      }
    })

    return () => {
      const child = slots.default?.(draggingData.value)
      if (!child) {
        return
      }

      return h(
        ThumbContext.Provider,
        {
          value: draggingData.value
        },
        isVue2
          ? child
          : {
              default: () => child
            }
      )
    }
  }
})
