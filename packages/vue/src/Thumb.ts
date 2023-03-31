import { computed, defineComponent, ExtractPropTypes, h, PropType, ref, watch } from 'vue'
import {
  definePropType,
  isVue2,
  useFirstQualifiedElement,
  useLeadingProps,
  withDefaultProps
} from 'vue-lib-toolkit'
import { useMergedState } from 'vue-reactivity-fantasy'
import { ChangeCallback, Coords, isEqualCoords } from '@fantasy-thumb/base'
import { useThumbDOM, UseThumbDOMProps } from './composables/useThumbDOM'
import { ThumbContext, ThumbContextValue } from './ThumbContext'
import { DraggingData } from './interface'

const ThumbPropsType = {
  ...UseThumbDOMProps,
  coords: definePropType<Coords>(Object),
  defaultCoords: definePropType<Coords>(Object),
  autoRef: Boolean,
  onChange: Function as PropType<ChangeCallback>,
  'onUpdate:coords': Function as PropType<ChangeCallback>
} as const

export const ThumbProps = withDefaultProps(ThumbPropsType, {
  autoRef: true
})

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
    const thumbElement = ref<HTMLElement | null | undefined>()

    const autoThumbElement = useFirstQualifiedElement<HTMLElement>((element) => {
      return element?.nodeType === 1
    })

    watch(
      [() => props.autoRef, autoThumbElement],
      ([autoRef, autoThumbElement]) => {
        if (autoRef) {
          thumbElement.value = autoThumbElement
        }
      },
      {
        immediate: true
      }
    )

    const { coords, dragging, setCoords } = useThumbDOM(
      thumbElement,
      useLeadingProps(props, { emit }) as UseThumbDOMProps
    )

    const draggingData = computed<DraggingData>(() => {
      return {
        ...coords.value,
        dragging: dragging.value
      }
    })

    const thumbContextValue = computed<ThumbContextValue>(() => {
      return {
        ...draggingData.value,
        setThumbElement: (element) => {
          if (!props.autoRef) {
            thumbElement.value = element
          }
        }
      }
    })

    const mergedCoords = useMergedState(
      () => props.coords,
      () => props.defaultCoords
    )

    watch(
      mergedCoords,
      (mergedCoords) => {
        if (mergedCoords && !isEqualCoords(mergedCoords, coords.value)) {
          setCoords(mergedCoords)
        }
      },
      {
        immediate: true
      }
    )

    watch(
      coords,
      (coords) => {
        if (!isEqualCoords(coords, props.coords)) {
          emit('change', coords)
          emit('update:coords', coords)
        }
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
          value: thumbContextValue.value
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
