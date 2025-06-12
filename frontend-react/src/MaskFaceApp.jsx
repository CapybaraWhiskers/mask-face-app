import React from 'react'
import './App.css'

function MaskFaceApp() {
  return (
    <div className="app-card">
      <h1>Mask Face App</h1>
      <label htmlFor="imageUpload" className="custom-file-label">Upload Image</label>
      <input type="file" id="imageUpload" style={{display:'none'}} accept="image/jpeg,image/png" />
      <div id="loading" className="hidden">Processing...</div>
      <div className="image-container"></div>
      <div className="button-row">
        <select id="maskType" className="mask-type-selector">
          <option value="emoji">Emoji</option>
          <option value="mosaic">Mosaic</option>
        </select>
        <select id="emojiSelector" className="emoji-selector">
          <option value="😊">😊</option>
          <option value="😠">😠</option>
          <option value="🤢">🤢</option>
          <option value="😨">😨</option>
          <option value="😄">😄</option>
          <option value="😐">😐</option>
          <option value="😢">😢</option>
          <option value="😮">😮</option>
        </select>
        <input type="range" id="mosaicSize" min="5" max="50" defaultValue="10" style={{display:'none'}} />
        <button id="addMarker">Add Marker</button>
        <button id="download">Download Masked Image</button>
      </div>
    </div>
  )
}

export default MaskFaceApp
