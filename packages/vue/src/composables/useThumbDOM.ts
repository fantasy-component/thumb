import {
  createThumbDOM,
  Direction,
  OffsetGetter,
  Position,
  PositionLimits,
  ThumbDOM
} from '@thumb-fantasy/base'
import {
  ExtractPropTypes,
  isRef,
  onBeforeUnmount,
  PropType,
  Ref,
  ref,
  unref,
  watch,
  watchEffect
} from 'vue'
import { MaybeRef } from 'vue-reactivity-fantasy'

export const UseThumbDOMProps = {
  disabled: Boolean,
  direction: {
    type: String as PropType<Direction>,
    default: 'horizontal'
  },
  min: [Number, Object] as PropType<number | PositionLimits>,
  max: [Number, Object] as PropType<number | PositionLimits>,
  getOffset: Function as PropType<OffsetGetter>
} as const

export type UseThumbDOMProps = ExtractPropTypes<typeof UseThumbDOMProps>

export type DraggingCallback = (
  position: Position,
  element: HTMLElement,
  event: TouchEvent | MouseEvent
) => void

export const UseThumbDOMCallbackProps = {
  onDragStart: Function as PropType<DraggingCallback>,
  onDragging: Function as PropType<DraggingCallback>,
  onDragEnd: Function as PropType<DraggingCallback>
} as const

export type UseThumbDOMCallbackProps = ExtractPropTypes<typeof UseThumbDOMCallbackProps>

export interface UseThumbReturn extends Pick<ThumbDOM, 'setPosition'> {
  position: Ref<Position | undefined>
  dragging: Ref<boolean>
  dragDistance: Ref<Position | undefined>
}

export function useThumbDOM(
  element: MaybeRef<HTMLElement | null | undefined>,
  props: UseThumbDOMProps,
  // TODO: move to props, Vue2 can't extract event callback function from props
  callbacks?: UseThumbDOMCallbackProps
): UseThumbReturn {
  const position = ref<Position>()
  const dragging = ref(false)
  const dragDistance = ref<Position>()

  const thumbDOM = createThumbDOM(null, null, {
    onChange(finger) {
      position.value = finger
      dragDistance.value = thumbDOM.getDragDistance()
    },
    onDragStart(finger, event) {
      dragging.value = true

      callbacks?.onDragStart?.(finger, unref(element)!, event)
    },
    onDragging(finger, event) {
      callbacks?.onDragging?.(finger, unref(element)!, event)
    },
    onDragEnd(finger, event) {
      dragging.value = false

      callbacks?.onDragEnd?.(finger, unref(element)!, event)
    }
  })

  const registerThumbElement = () => {
    thumbDOM.registerThumbElement(unref(element))
  }

  if (isRef(element)) {
    watch(element, registerThumbElement)
  } else {
    registerThumbElement()
  }

  watchEffect(() => {
    thumbDOM.setOptions({
      direction: props.direction,
      min: props.min,
      max: props.max,
      getOffset: props.getOffset
    })
  })

  watch(
    () => props.disabled,
    (disabled) => {
      thumbDOM.setDisabled(disabled)
    },
    {
      immediate: true
    }
  )

  onBeforeUnmount(() => {
    thumbDOM.unregisterThumbElement()
  })

  return {
    position,
    dragging,
    dragDistance,
    setPosition: (position) => thumbDOM.setPosition(position)
  }
}
