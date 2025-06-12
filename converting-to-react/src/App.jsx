/* global faceapi */
import { useEffect, useRef, useState } from 'react'
import Marker from './components/Marker'
import ImageUploader from './components/ImageUploader'
import ImagePreview from './components/ImagePreview'
import Controls from './components/Controls'
import './App.css'

const expressionEmojiMap = {
  angry: '😠',
  disgusted: '🤢',
  fearful: '😨',
  happy: '😄',
  neutral: '😐',
  sad: '😢',
  surprised: '😮'
}

let idCounter = 0
const nextId = () => ++idCounter

function drawMosaic(ctx, image, sx, sy, sw, sh, pixel) {
  const tmpW = Math.max(1, Math.floor(sw / pixel))
  const tmpH = Math.max(1, Math.floor(sh / pixel))
  const tmp = document.createElement('canvas')
  tmp.width = tmpW
  tmp.height = tmpH
  const tctx = tmp.getContext('2d')
  tctx.drawImage(image, sx, sy, sw, sh, 0, 0, tmpW, tmpH)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, tmpW, tmpH, sx, sy, sw, sh)
}

function App() {
  const [maskType, setMaskType] = useState('emoji')
  const [mosaicSize, setMosaicSize] = useState(10)
  const [emoji, setEmoji] = useState('😊')
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const imgRef = useRef(null)

  const handleImageChange = async e => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setMarkers([])
    const form = new FormData()
    form.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { url } = await res.json()
    setImageUrl(url)
  }

  const handleImageLoad = async e => {
    const img = e.target
    imgRef.current = img
    if (!modelsLoaded) {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('models')
      await faceapi.nets.faceExpressionNet.loadFromUri('models')
      setModelsLoaded(true)
    }
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceExpressions()
    const scaleX = img.clientWidth / img.naturalWidth
    const scaleY = img.clientHeight / img.naturalHeight
    const newMarkers = detections.map(det => {
      const { x, y, width } = det.detection.box
      if (maskType === 'mosaic') {
        return {
          id: nextId(),
          type: 'mosaic',
          x: x * scaleX,
          y: y * scaleY,
          size: width * scaleX,
          pixel: mosaicSize,
          dimmed: false
        }
      }
      const expressions = det.expressions
      const best = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      )
      return {
        id: nextId(),
        type: 'emoji',
        x: x * scaleX,
        y: y * scaleY,
        size: width * scaleX,
        emoji: expressionEmojiMap[best] || '😊',
        dimmed: false
      }
    })
    setMarkers(newMarkers)
    setLoading(false)
  }

  const addMarker = () => {
    const img = imgRef.current
    if (!img) return
    const size = 80
    const x = (img.clientWidth - size) / 2
    const y = (img.clientHeight - size) / 2
    if (maskType === 'mosaic') {
      setMarkers(m => [
        ...m,
        { id: nextId(), type: 'mosaic', x, y, size, pixel: mosaicSize, dimmed: false }
      ])
    } else {
      setMarkers(m => [
        ...m,
        { id: nextId(), type: 'emoji', x, y, size, emoji, dimmed: false }
      ])
    }
  }

  const updateMarker = (id, props) => {
    setMarkers(m => m.map(marker => (marker.id === id ? { ...marker, ...props } : marker)))
  }

  const toggleMarker = id => {
    setMarkers(m => m.map(marker => (marker.id === id ? { ...marker, dimmed: !marker.dimmed } : marker)))
  }

  const downloadImage = () => {
    const img = imgRef.current
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight
    markers.forEach(m => {
      if (m.dimmed) return
      if (m.type === 'emoji') {
        const centerX = (m.x + m.size / 2) * scaleX
        const centerY = (m.y + m.size / 2) * scaleY
        const fontSize = m.size * scaleY
        ctx.font = `${fontSize}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(m.emoji, centerX, centerY)
      } else {
        drawMosaic(ctx, img, m.x * scaleX, m.y * scaleY, m.size * scaleX, m.size * scaleY, m.pixel)
      }
    })
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'masked.png'
    link.click()
  }

  useEffect(() => {
    setMarkers(m =>
      m.map(marker => (marker.type === 'mosaic' ? { ...marker, pixel: mosaicSize } : marker))
    )
  }, [mosaicSize])

  return (
    <div className="app-card">
      <h1>Mask Face App</h1>
      <ImageUploader onChange={handleImageChange} loading={loading} />
      <ImagePreview
        imageUrl={imageUrl}
        markers={markers}
        imgRef={imgRef}
        onLoad={handleImageLoad}
        onUpdate={updateMarker}
        onToggle={toggleMarker}
        onClick={() => setMarkers(m => m)}
      />
      <Controls
        maskType={maskType}
        setMaskType={setMaskType}
        mosaicSize={mosaicSize}
        setMosaicSize={setMosaicSize}
        emoji={emoji}
        setEmoji={setEmoji}
        addMarker={addMarker}
        downloadImage={downloadImage}
      />
    </div>
  )
}

export default App
