import {
  axis,
  compose,
  createThumbDOM,
  limit,
  offset as offsetMiddleware,
  PartialCoords
} from '../src'

const thumb = document.getElementById('thumb')!

let offset: PartialCoords | null = null

const thumbDOM = createThumbDOM(thumb, null, {
  middleware: compose(
    offsetMiddleware(() => offset),
    limit(() => {
      return {
        min: { x: 0, y: 0 },
        max: { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      }
    }),
    axis('x')
  ),

  onDragStart(coords) {
    thumb.classList.add('dragging')

    const { top, left } = thumb.getBoundingClientRect()
    offset = {
      x: coords.x - left,
      y: coords.y - top
    }
  },

  onDragEnd() {
    thumb.classList.remove('dragging')
  },

  onChange(coords) {
    thumb.style.top = `${coords.y}px`
    thumb.style.left = `${coords.x}px`
  }
})
