'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { toast } from 'react-hot-toast'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  currentImage?: string
  onImageRemove?: () => void
  label?: string
  accept?: string
  className?: string
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  onImageRemove,
  label = 'Upload Image',
  accept = 'image/*',
  className = ''
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Call the callback
    onImageSelect(file)
  }

  const removeImage = () => {
    setPreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onImageRemove?.()
  }

  const displayImage = preview || currentImage

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${displayImage ? 'pb-2' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayImage ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={displayImage}
                alt="Preview"
                className="rounded-lg object-cover max-w-full max-h-32"
                style={{ width: 'auto', height: 'auto' }}
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag & drop a new image or click to replace
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {uploading ? 'Uploading...' : 'Drop your image here'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or{' '}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                PNG, JPG, GIF. No enforced upload size limit.
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  )
}