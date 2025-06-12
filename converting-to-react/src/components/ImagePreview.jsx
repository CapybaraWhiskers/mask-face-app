import React from 'react'
import Marker from './Marker'

export default function ImagePreview({ imageUrl, markers, imgRef, onLoad, onUpdate, onToggle, onClick }) {
  return (
    <div className="image-container" onClick={onClick}>
      {imageUrl && (
        <img src={imageUrl} alt="uploaded" id="uploadedImage" onLoad={onLoad} ref={imgRef} />
      )}
      {markers.map(marker => (
        <Marker
          key={marker.id}
          marker={marker}
          uploadedImage={imgRef.current}
          onUpdate={onUpdate}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
