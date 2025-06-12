import { useEffect, useRef } from 'react'

function makeDraggableResizable(el, onUpdate) {
  let dragging = false
  let startX, startY, startLeft, startTop

  el.addEventListener('pointerdown', e => {
    e.stopPropagation()
    dragging = true
    el._wasDragged = false
    startX = e.clientX
    startY = e.clientY
    startLeft = parseFloat(el.style.left)
    startTop = parseFloat(el.style.top)
    el.setPointerCapture(e.pointerId)
  })

  el.addEventListener('pointermove', e => {
    if (!dragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    el.style.left = startLeft + dx + 'px'
    el.style.top = startTop + dy + 'px'
    el._wasDragged = true
  })

  el.addEventListener('pointerup', e => {
    dragging = false
    el.releasePointerCapture(e.pointerId)
    if (onUpdate) onUpdate(el)
  })

  el.addEventListener('wheel', e => {
    e.preventDefault()
    let size = parseFloat(el.style.width)
    size += e.deltaY < 0 ? 5 : -5
    size = Math.max(10, size)
    el.style.width = size + 'px'
    el.style.height = size + 'px'
    el.style.fontSize = size + 'px'
    if (onUpdate) onUpdate(el)
  })
}

function drawMosaicCanvas(canvas, image, pixel) {
  if (!image) return
  const scaleX = image.naturalWidth / image.clientWidth
  const scaleY = image.naturalHeight / image.clientHeight
  const left = parseFloat(canvas.style.left)
  const top = parseFloat(canvas.style.top)
  const width = parseFloat(canvas.style.width)
  const height = parseFloat(canvas.style.height)
  const sx = left * scaleX
  const sy = top * scaleY
  const sw = width * scaleX
  const sh = height * scaleY
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  const tmpW = Math.max(1, Math.floor(sw / pixel))
  const tmpH = Math.max(1, Math.floor(sh / pixel))
  const tmp = document.createElement('canvas')
  tmp.width = tmpW
  tmp.height = tmpH
  const tctx = tmp.getContext('2d')
  tctx.drawImage(image, sx, sy, sw, sh, 0, 0, tmpW, tmpH)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, tmpW, tmpH, 0, 0, width, height)
}

export default function Marker({ marker, uploadedImage, onUpdate, onToggle }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.left = marker.x + 'px'
    el.style.top = marker.y + 'px'
    el.style.width = marker.size + 'px'
    el.style.height = marker.size + 'px'
    el.style.fontSize = marker.size + 'px'
    el.dataset.pixel = marker.pixel
    if (marker.type === 'mosaic') {
      drawMosaicCanvas(el, uploadedImage, marker.pixel)
    }
  }, [marker, uploadedImage])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = el => {
      const x = parseFloat(el.style.left)
      const y = parseFloat(el.style.top)
      const size = parseFloat(el.style.width)
      onUpdate(marker.id, { x, y, size })
      if (marker.type === 'mosaic') {
        drawMosaicCanvas(el, uploadedImage, marker.pixel)
      }
    }
    makeDraggableResizable(el, update)
    const handleClick = e => {
      e.stopPropagation()
      if (el._wasDragged) {
        el._wasDragged = false
        return
      }
      onToggle(marker.id)
    }
    el.addEventListener('click', handleClick)
    return () => {
      el.removeEventListener('click', handleClick)
    }
  }, [marker.id, onToggle, uploadedImage])

  const className = `${marker.type === 'emoji' ? 'emoji-marker' : 'mosaic-marker'}${marker.dimmed ? ' dimmed' : ''}`

  if (marker.type === 'emoji') {
    return <span ref={ref} className={className}>{marker.emoji}</span>
  }
  return <canvas ref={ref} className={className}></canvas>
}

export { makeDraggableResizable, drawMosaicCanvas }
