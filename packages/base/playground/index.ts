import { createThumbDOM, Position } from '../src'

const thumb = document.getElementById('thumb')!

const thumbDOM = createThumbDOM(thumb, {
  direction: 'omnidirectional',

  min: {
    x: 0,
    y: 0
  },

  onDragStart(event, finger) {
    thumb.classList.add('dragging')

    const { top, left } = thumb.getBoundingClientRect()
    thumbDOM.setOffset({
      x: finger.x - left,
      y: finger.y - top
    })
  },

  onDragEnd() {
    thumb.classList.remove('dragging')
  },

  onChange(position) {
    thumb.style.top = `${position.y}px`
    thumb.style.left = `${position.x}px`
  }
})
