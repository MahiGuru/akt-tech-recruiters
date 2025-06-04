'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertCircle, 
  Download,
  Eye,
  FileText,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumeUpload({ 
  currentResumeUrl = null, 
  onUploadSuccess, 
  onUploadError,
  userId,
  className = "" 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const fileInputRef = useRef(null)

  // Accepted file types
  const acceptedTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  }

  const maxFileSize = 5 * 1024 * 1024 // 5MB

  const validateFile = (file) => {
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      throw new Error('Please upload a PDF, DOC, DOCX, or TXT file')
    }
    
    if (file.size > maxFileSize) {
      throw new Error('File size must be less than 5MB')
    }
    
    return true
  }

  const uploadFile = async (file) => {
    try {
      validateFile(file)
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('resume', file)
      formData.append('userId', userId)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const result = await response.json()
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        url: result.url,
        type: file.type
      })

      toast.success('Resume uploaded successfully!')
      onUploadSuccess?.(result.url, file.name)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message)
      onUploadError?.(error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (files) => {
    const file = files[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    handleFileSelect(files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const removeFile = async () => {
    try {
      const response = await fetch('/api/upload/resume', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setUploadedFile(null)
        toast.success('Resume removed successfully')
        onUploadSuccess?.(null, null)
      }
    } catch (error) {
      toast.error('Failed to remove resume')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type && type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-success-600" />
    }
    return <File className="w-5 h-5 text-success-600" />
  }

  // Show current resume if exists
  const displayFile = uploadedFile || (currentResumeUrl ? {
    name: 'Current Resume',
    url: currentResumeUrl,
    size: null,
    type: 'application/pdf'
  } : null)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="form-group">
        <label className="form-label">
          Resume Upload
        </label>
        <p className="text-sm text-secondary-600 mb-3">
          Upload your resume in PDF, DOC, DOCX, or TXT format (max 5MB)
        </p>
      </div>

      <AnimatePresence mode="wait">
        {displayFile ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card card-compact bg-success-50 border-success-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  {getFileIcon(displayFile.type)}
                </div>
                <div>
                  <p className="font-medium text-success-900">{displayFile.name}</p>
                  {displayFile.size && (
                    <p className="text-sm text-success-600">{formatFileSize(displayFile.size)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {displayFile.url && (
                  <>
                    <button
                      onClick={() => window.open(displayFile.url, '_blank')}
                      className="btn btn-ghost btn-sm text-success-600 hover:text-success-700"
                      aria-label="View resume"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={displayFile.url}
                      download
                      className="btn btn-ghost btn-sm text-success-600 hover:text-success-700"
                      aria-label="Download resume"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                )}
                <button
                  onClick={removeFile}
                  className="btn btn-ghost btn-sm text-error-600 hover:text-error-700"
                  aria-label="Remove resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragging 
                  ? 'border-primary-400 bg-primary-50' 
                  : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
                }
                ${isUploading ? 'pointer-events-none' : ''}
              `}
              role="button"
              tabIndex={0}
              aria-label="Upload resume file"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openFileDialog()
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={Object.values(acceptedTypes).join(',')}
                onChange={handleFileInputChange}
                className="sr-only"
                aria-describedby="file-upload-description"
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <div className="loading-spinner w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-primary-900">Uploading...</p>
                    <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-primary-600 mt-1">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-secondary-900">
                      {isDragging ? 'Drop your resume here' : 'Upload your resume'}
                    </p>
                    <p id="file-upload-description" className="text-sm text-secondary-600 mt-1">
                      Drag and drop or click to browse
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-secondary-500">
                    {Object.values(acceptedTypes).map(ext => (
                      <span key={ext} className="px-2 py-1 bg-secondary-100 rounded">
                        {ext.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replace existing file option */}
      {displayFile && !isUploading && (
        <button
          onClick={openFileDialog}
          className="btn btn-secondary w-full"
        >
          <Upload className="w-4 h-4" />
          Upload New Resume
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={Object.values(acceptedTypes).join(',')}
        onChange={handleFileInputChange}
        className="sr-only"
      />
    </div>
  )
}
