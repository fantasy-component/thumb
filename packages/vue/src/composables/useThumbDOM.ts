import {
  Axis,
  axis as axisMiddleware,
  compose,
  Coords,
  CoordsLimit,
  createThumbDOM,
  isEqualCoords,
  limit as limitMiddleware,
  Middleware,
  ThumbDOM,
  ThumbDOMOptions
} from '@fantasy-thumb/base'
import { ExtractPropTypes, getCurrentInstance, onBeforeUnmount, Ref, ref, unref, watch } from 'vue'
import { definePropType, MaybeRef, withDefaultProps } from 'vue-lib-toolkit'
import { useEffect } from 'vue-reactivity-fantasy'

const UseThumbDOMPropsType = {
  disabled: Boolean,
  axis: definePropType<Axis>(String),
  buttons: definePropType<number[]>(Array),
  min: definePropType<number | CoordsLimit>([Number, Object]),
  max: definePropType<number | CoordsLimit>([Number, Object]),
  middleware: definePropType<ThumbDOMOptions['middleware']>(Function),
  onDragStart: definePropType<ThumbDOMOptions['onDragStart']>(),
  onDragging: definePropType<ThumbDOMOptions['onDragging']>(),
  onDragEnd: definePropType<ThumbDOMOptions['onDragEnd']>()
}

export const UseThumbDOMProps = withDefaultProps(UseThumbDOMPropsType, {
  axis: 'x'
})

export type UseThumbDOMProps = ExtractPropTypes<typeof UseThumbDOMProps>

export interface UseThumbDOMReturn extends Pick<ThumbDOM, 'setCoords'> {
  coords: Ref<Coords>
  dragging: Ref<boolean>
}

export function useThumbDOM(
  element: MaybeRef<HTMLElement | null | undefined>,
  props: UseThumbDOMProps
): UseThumbDOMReturn {
  const thumbDOM = createThumbDOM(null, null, {
    onChange(nextCoords) {
      if (!isEqualCoords(coords.value, nextCoords)) {
        coords.value = nextCoords
      }
    },
    onDragStart(...args) {
      dragging.value = true
      return props?.onDragStart?.(...args)
    },
    onDragging(...args) {
      props?.onDragging?.(...args)
    },
    onDragEnd(...args) {
      dragging.value = false
      props?.onDragEnd?.(...args)
    }
  })

  watch(
    () => unref(element),
    (element) => {
      thumbDOM.registerThumbElement(element)
    },
    {
      immediate: true
    }
  )

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      thumbDOM.unregisterThumbElement()
    })
  }

  const coords = ref<Coords>(thumbDOM.getCoords())
  const dragging = ref(false)

  const middleware = compose(
    axisMiddleware(() => props.axis),
    limitMiddleware(() => ({
      min: props.min,
      max: props.max
    }))
  )

  useEffect(() => {
    thumbDOM.setOptions({
      disabled: props.disabled,
      middleware: compose(...([props.middleware, middleware].filter(Boolean) as Middleware[]))
    })
  })

  return {
    coords,
    dragging,
    setCoords: (coords) => thumbDOM.setCoords(coords)
  }
}
