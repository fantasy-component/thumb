import {
  createThumbDOM,
  Direction,
  DraggingContextCreator,
  Position,
  PositionLimits,
  ThumbDOM
} from '@thumb-fantasy/base'
import { ExtractPropTypes, getCurrentInstance, onBeforeUnmount, Ref, ref, unref } from 'vue'
import { definePropType, MaybeRef } from 'vue-lib-toolkit'
import { useEffect } from 'vue-reactivity-fantasy'

export type DraggingCallback = (
  position: Position,
  element: HTMLElement,
  event: TouchEvent | MouseEvent
) => void

export const UseThumbDOMProps = {
  disabled: Boolean,
  direction: definePropType<Direction>(String),
  buttons: definePropType<number[]>(Array),
  min: definePropType<number | PositionLimits>([Number, Object]),
  max: definePropType<number | PositionLimits>([Number, Object]),
  createDraggingContext: definePropType<DraggingContextCreator>(Function),
  onDragStart: definePropType<DraggingCallback>(),
  onDragging: definePropType<DraggingCallback>(),
  onDragEnd: definePropType<DraggingCallback>()
}

export type UseThumbDOMProps = ExtractPropTypes<typeof UseThumbDOMProps>

export interface UseThumbDOMReturn extends Pick<ThumbDOM, 'setPosition'> {
  position: Ref<Position>
  dragging: Ref<boolean>
  dragDistance: Ref<Position | undefined>
}

export function useThumbDOM(
  element: MaybeRef<HTMLElement | null | undefined>,
  props: UseThumbDOMProps
): UseThumbDOMReturn {
  const thumbDOM = createThumbDOM(null, null, {
    onPositionChange(finger) {
      position.value = finger
      dragDistance.value = thumbDOM.getDragDistance()
    },
    onDragStart(finger, event) {
      dragging.value = true
      props?.onDragStart?.(finger, thumbDOM.getThumbElement()!, event)
    },
    onDragging(finger, event) {
      props?.onDragging?.(finger, thumbDOM.getThumbElement()!, event)
    },
    onDragEnd(finger, event) {
      dragging.value = false
      props?.onDragEnd?.(finger, thumbDOM.getThumbElement()!, event)
    }
  })

  const position = ref<Position>(thumbDOM.getPosition())
  const dragging = ref(false)
  const dragDistance = ref<Position>()

  useEffect(
    (onCleanup, element) => {
      thumbDOM.registerThumbElement(element)
      onCleanup(() => thumbDOM.unregisterThumbElement())
    },
    () => unref(element),
    {
      immediate: true
    }
  )

  useEffect(
    () => {
      thumbDOM.setDisabled(props.disabled)
    },
    () => props.disabled,
    {
      immediate: true
    }
  )

  useEffect(() => {
    thumbDOM.setOptions({
      direction: props.direction || 'horizontal',
      min: props.min,
      max: props.max,
      createDraggingContext: props.createDraggingContext
    })
  })

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      thumbDOM.unregisterThumbElement()
    })
  }

  return {
    position,
    dragging,
    dragDistance,
    setPosition: (position) => thumbDOM.setPosition(position)
  }
}
