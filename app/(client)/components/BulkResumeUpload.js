'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  X, 
  Plus,
  Download,
  Eye,
  FileText,
  Trash2,
  Edit3,
  Star,
  Calendar,
  Briefcase,
  Award,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'

const experienceLevels = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level', color: 'bg-green-100 text-green-800' },
  { value: 'MID_LEVEL', label: 'Mid Level', color: 'bg-blue-100 text-blue-800' },
  { value: 'SENIOR_LEVEL', label: 'Senior Level', color: 'bg-purple-100 text-purple-800' },
  { value: 'EXECUTIVE', label: 'Executive', color: 'bg-red-100 text-red-800' },
  { value: 'FREELANCE', label: 'Freelance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'INTERNSHIP', label: 'Internship', color: 'bg-gray-100 text-gray-800' }
]

export default function BulkResumeUpload({ 
  onUploadSuccess,
  onUploadError,
  candidates = [],
  className = "" 
}) {
  const [resumes, setResumes] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [candidateMapping, setCandidateMapping] = useState({})
  const fileInputRef = useRef(null)

  // Form state for bulk upload
  const [bulkUploadSettings, setBulkUploadSettings] = useState({
    defaultExperienceLevel: 'MID_LEVEL',
    autoMapToCandidates: false,
    createTitlesFromFilenames: true
  })

  const acceptedTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  }

  const maxFileSize = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/recruiter/resumes')
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      } else {
        console.error('Failed to fetch resumes:', response.status)
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  const validateFile = (file) => {
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      throw new Error(`${file.name}: Please upload a PDF, DOC, DOCX, or TXT file`)
    }
    
    if (file.size > maxFileSize) {
      throw new Error(`${file.name}: File size must be less than 5MB`)
    }
    
    return true
  }

  const generateTitleFromFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
    return nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }

  const extractCandidateFromFilename = (filename) => {
    const cleanName = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, ' ')
      .toLowerCase()
    
    return candidates.find(candidate => 
      cleanName.includes(candidate.name.toLowerCase()) ||
      candidate.name.toLowerCase().includes(cleanName.split(' ')[0])
    )
  }

  const uploadBulkResumes = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    try {
      setIsUploading(true)
      const results = []
      
      // Upload files one by one with progress tracking
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileData = selectedFiles[i]
        const file = fileData.file
        
        try {
          validateFile(file)
          
          // Update progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'uploading', progress: 0 }
          }))

          const formData = new FormData()
          formData.append('resume', file)
          formData.append('title', fileData.title)
          formData.append('description', fileData.description || '')
          formData.append('experienceLevel', fileData.experienceLevel)
          formData.append('originalName', file.name)
          
          // Add candidate mapping if selected
          if (fileData.candidateId) {
            formData.append('candidateId', fileData.candidateId)
          }

          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { 
                status: 'uploading', 
                progress: Math.min((prev[file.name]?.progress || 0) + 20, 90) 
              }
            }))
          }, 200)

          const response = await fetch('/api/recruiter/resumes', {
            method: 'POST',
            body: formData
          })

          clearInterval(progressInterval)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Upload failed')
          }

          const result = await response.json()
          results.push({ file: file.name, success: true, data: result.resume })
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'success', progress: 100 }
          }))

        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error)
          results.push({ file: file.name, success: false, error: error.message })
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'error', progress: 0, error: error.message }
          }))
        }
      }

      // Show summary
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      if (successful > 0) {
        toast.success(`Successfully uploaded ${successful} resume(s)`)
        onUploadSuccess?.(results.filter(r => r.success))
        await fetchResumes()
      }

      if (failed > 0) {
        toast.error(`Failed to upload ${failed} file(s)`)
        onUploadError?.(results.filter(r => !r.success))
      }

      // Reset form
      setTimeout(() => {
        setSelectedFiles([])
        setUploadProgress({})
        setShowUploadForm(false)
      }, 2000)

    } catch (error) {
      console.error('Bulk upload error:', error)
      toast.error('Bulk upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (files) => {
    const fileList = Array.from(files)
    const newFiles = []

    fileList.forEach(file => {
      try {
        validateFile(file)
        
        const title = bulkUploadSettings.createTitlesFromFilenames 
          ? generateTitleFromFilename(file.name)
          : ''
        
        const suggestedCandidate = bulkUploadSettings.autoMapToCandidates 
          ? extractCandidateFromFilename(file.name)
          : null

        newFiles.push({
          file,
          title,
          description: '',
          experienceLevel: bulkUploadSettings.defaultExperienceLevel,
          candidateId: suggestedCandidate?.id || '',
          suggestedCandidate
        })
      } catch (error) {
        toast.error(error.message)
      }
    })

    setSelectedFiles(prev => [...prev, ...newFiles])
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
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    handleFileSelect(files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateFileData = (index, field, value) => {
    setSelectedFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [field]: value } : file
    ))
  }

  const getExperienceColor = (level) => {
    return experienceLevels.find(l => l.value === level)?.color || 'bg-gray-100 text-gray-800'
  }

  const getExperienceLabel = (level) => {
    return experienceLevels.find(l => l.value === level)?.label || level
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetUploadForm = () => {
    setSelectedFiles([])
    setUploadProgress({})
    setShowUploadForm(false)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Bulk Resume Management</h3>
          <p className="text-sm text-secondary-600">
            Upload multiple resumes and map them to candidates
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="btn btn-primary btn-sm"
          disabled={isUploading}
        >
          <Plus className="w-4 h-4" />
          Bulk Upload
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{resumes.length}</div>
              <div className="text-sm text-gray-600">Total Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {resumes.filter(r => r.candidateId).length}
              </div>
              <div className="text-sm text-gray-600">Candidate Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {resumes.filter(r => r.userId).length}
              </div>
              <div className="text-sm text-gray-600">User Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {resumes.filter(r => r.isPrimary).length}
              </div>
              <div className="text-sm text-gray-600">Primary Resumes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isUploading) {
                resetUploadForm()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Bulk Resume Upload</h3>
                <button
                  onClick={resetUploadForm}
                  className="btn btn-ghost btn-sm"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Settings */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-3">Upload Settings</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Default Experience Level</label>
                    <select
                      value={bulkUploadSettings.defaultExperienceLevel}
                      onChange={(e) => setBulkUploadSettings(prev => ({
                        ...prev,
                        defaultExperienceLevel: e.target.value
                      }))}
                      className="input-field"
                      disabled={isUploading}
                    >
                      {experienceLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkUploadSettings.createTitlesFromFilenames}
                        onChange={(e) => setBulkUploadSettings(prev => ({
                          ...prev,
                          createTitlesFromFilenames: e.target.checked
                        }))}
                        disabled={isUploading}
                      />
                      <span className="text-sm">Auto-generate titles from filenames</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkUploadSettings.autoMapToCandidates}
                        onChange={(e) => setBulkUploadSettings(prev => ({
                          ...prev,
                          autoMapToCandidates: e.target.checked
                        }))}
                        disabled={isUploading}
                      />
                      <span className="text-sm">Auto-map to candidates by name</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              {selectedFiles.length === 0 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={!isUploading ? openFileDialog : undefined}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                    ${isDragging 
                      ? 'border-primary-400 bg-primary-50' 
                      : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
                    }
                    ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={Object.values(acceptedTypes).join(',')}
                    onChange={handleFileInputChange}
                    className="sr-only"
                    multiple
                    disabled={isUploading}
                  />
                  
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-secondary-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-secondary-900">
                        {isDragging ? 'Drop your resume files here' : 'Choose or drop multiple resume files'}
                      </p>
                      <p className="text-sm text-secondary-600">
                        PDF, DOC, DOCX, TXT (max 5MB each)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <button
                      onClick={openFileDialog}
                      className="btn btn-secondary btn-sm"
                      disabled={isUploading}
                    >
                      <Plus className="w-4 h-4" />
                      Add More Files
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedFiles.map((fileData, index) => {
                      const progress = uploadProgress[fileData.file.name]
                      
                      return (
                        <div
                          key={`${fileData.file.name}-${index}`}
                          className={`border rounded-lg p-4 ${
                            progress?.status === 'success' ? 'border-green-200 bg-green-50' :
                            progress?.status === 'error' ? 'border-red-200 bg-red-50' :
                            progress?.status === 'uploading' ? 'border-blue-200 bg-blue-50' :
                            'border-gray-200'
                          }`}
                        >
                          <div className="grid md:grid-cols-12 gap-4 items-start">
                            {/* File Info */}
                            <div className="md:col-span-3">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{fileData.file.name}</span>
                                {!isUploading && (
                                  <button
                                    onClick={() => removeSelectedFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(fileData.file.size)}
                              </p>
                            </div>

                            {/* Title */}
                            <div className="md:col-span-3">
                              <input
                                type="text"
                                value={fileData.title}
                                onChange={(e) => updateFileData(index, 'title', e.target.value)}
                                placeholder="Resume title"
                                className="input-field text-sm"
                                disabled={isUploading}
                              />
                            </div>

                            {/* Experience Level */}
                            <div className="md:col-span-2">
                              <select
                                value={fileData.experienceLevel}
                                onChange={(e) => updateFileData(index, 'experienceLevel', e.target.value)}
                                className="input-field text-sm"
                                disabled={isUploading}
                              >
                                {experienceLevels.map(level => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Candidate Mapping */}
                            <div className="md:col-span-3">
                              <select
                                value={fileData.candidateId}
                                onChange={(e) => updateFileData(index, 'candidateId', e.target.value)}
                                className="input-field text-sm"
                                disabled={isUploading}
                              >
                                <option value="">Select candidate (optional)</option>
                                {candidates.map(candidate => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.name} ({candidate.email})
                                  </option>
                                ))}
                              </select>
                              {fileData.suggestedCandidate && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Suggested: {fileData.suggestedCandidate.name}
                                </p>
                              )}
                            </div>

                            {/* Status */}
                            <div className="md:col-span-1">
                              {progress?.status === 'uploading' && (
                                <div className="flex items-center gap-1">
                                  <div className="loading-spinner w-3 h-3" />
                                  <span className="text-xs">{progress.progress}%</span>
                                </div>
                              )}
                              {progress?.status === 'success' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {progress?.status === 'error' && (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {progress?.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="w-full bg-blue-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {progress?.status === 'error' && (
                            <div className="mt-2 text-xs text-red-600">
                              {progress.error}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetUploadForm}
                      className="btn btn-secondary flex-1"
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={uploadBulkResumes}
                      disabled={isUploading || selectedFiles.length === 0 || selectedFiles.some(f => !f.title.trim())}
                      className="btn btn-primary flex-1"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="loading-spinner w-4 h-4" />
                          Uploading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload {selectedFiles.length} Resume(s)
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={Object.values(acceptedTypes).join(',')}
                onChange={handleFileInputChange}
                className="sr-only"
                multiple
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}