import { createThumbDOM } from '../src'

const thumb = document.getElementById('thumb')!

const thumbDOM = createThumbDOM(thumb, null, {
  direction: 'omnidirectional',

  min: {
    x: 0,
    y: 0
  },

  onDragStart() {
    thumb.classList.add('dragging')
  },

  onDragEnd() {
    thumb.classList.remove('dragging')
  },

  createDraggingContext(finger) {
    const { top, left } = thumb.getBoundingClientRect()
    return {
      offset: {
        x: finger.x - left,
        y: finger.y - top
      }
    }
  },

  onPositionChange(position) {
    thumb.style.top = `${position.y}px`
    thumb.style.left = `${position.x}px`
  }
})
