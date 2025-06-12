import React from 'react'

export default function Controls({
  maskType,
  setMaskType,
  mosaicSize,
  setMosaicSize,
  emoji,
  setEmoji,
  addMarker,
  downloadImage,
}) {
  return (
    <div className="button-row">
      <select
        id="maskType"
        className="mask-type-selector"
        value={maskType}
        onChange={e => setMaskType(e.target.value)}
      >
        <option value="emoji">Emoji</option>
        <option value="mosaic">Mosaic</option>
      </select>
      {maskType === 'emoji' ? (
        <select
          id="emojiSelector"
          className="emoji-selector"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
        >
          <option value="😊">😊</option>
          <option value="😠">😠</option>
          <option value="🤢">🤢</option>
          <option value="😨">😨</option>
          <option value="😄">😄</option>
          <option value="😐">😐</option>
          <option value="😢">😢</option>
          <option value="😮">😮</option>
        </select>
      ) : (
        <input
          type="range"
          id="mosaicSize"
          min="5"
          max="50"
          value={mosaicSize}
          onChange={e => setMosaicSize(parseInt(e.target.value))}
        />
      )}
      <button id="addMarker" onClick={addMarker}>
        Add Marker
      </button>
      <button id="download" onClick={downloadImage}>
        Download Masked Image
      </button>
    </div>
  )
}
