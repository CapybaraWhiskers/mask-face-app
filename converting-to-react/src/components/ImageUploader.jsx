import React from 'react'

export default function ImageUploader({ onChange, loading }) {
  return (
    <>
      <label htmlFor="imageUpload" className="custom-file-label">Upload Image</label>
      <input
        type="file"
        id="imageUpload"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={onChange}
      />
      {loading && <div id="loading">Processing...</div>}
    </>
  )
}
