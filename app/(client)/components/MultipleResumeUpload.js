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
  AlertCircle
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

export default function MultipleResumeUpload({ 
  userId,
  userName,
  onUploadSuccess,
  onUploadError,
  className = "" 
}) {
  const [resumes, setResumes] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Form state for new resume
  const [resumeForm, setResumeForm] = useState({
    title: '',
    description: '',
    experienceLevel: 'MID_LEVEL'
  })

  const acceptedTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  }

  const maxFileSize = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    if (userId) {
      fetchResumes()
    }
  }, [userId])

  const fetchResumes = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/resumes?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
        console.log('Fetched resumes:', data)
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
    console.log('Validating file:', file.name, file.type, file.size)
    
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      throw new Error('Please upload a PDF, DOC, DOCX, or TXT file')
    }
    
    if (file.size > maxFileSize) {
      throw new Error('File size must be less than 5MB')
    }
    
    return true
  }

  const uploadResume = async (file) => {
    try {
      console.log('Starting upload for file:', file.name)
      validateFile(file)
      setIsUploading(true)
      setUploadProgress(0)

      // Validate form data
      if (!resumeForm.title.trim()) {
        throw new Error('Resume title is required')
      }

      const formData = new FormData()
      formData.append('resume', file)
      formData.append('userId', userId)
      formData.append('title', resumeForm.title.trim())
      formData.append('description', resumeForm.description.trim())
      formData.append('experienceLevel', resumeForm.experienceLevel)
      formData.append('originalName', file.name)

      console.log('Form data prepared:', {
        fileName: file.name,
        userId,
        title: resumeForm.title,
        experienceLevel: resumeForm.experienceLevel
      })

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

      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Upload error response:', errorData)
        throw new Error(errorData.message || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      toast.success('Resume uploaded successfully!')
      onUploadSuccess?.(result.resume)
      
      // Reset form and close modal
      setResumeForm({ title: '', description: '', experienceLevel: 'MID_LEVEL' })
      setShowUploadForm(false)
      
      // Refresh resumes list
      await fetchResumes()

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
    console.log('File selected:', files)
    const file = files[0]
    if (file) {
      // Auto-generate title if not provided
      if (!resumeForm.title.trim()) {
        const level = experienceLevels.find(l => l.value === resumeForm.experienceLevel)
        const autoTitle = `${level?.label} Resume`
        setResumeForm(prev => ({ ...prev, title: autoTitle }))
        
        // Wait a bit for state to update, then upload
        setTimeout(() => {
          uploadResume(file)
        }, 100)
      } else {
        uploadResume(file)
      }
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
    console.log('Files dropped:', files)
    handleFileSelect(files)
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    console.log('Files from input:', files)
    handleFileSelect(files)
  }

  const openFileDialog = () => {
    console.log('Opening file dialog')
    fileInputRef.current?.click()
  }

  const deleteResume = async (resumeId, resumeTitle) => {
    if (!confirm(`Are you sure you want to delete "${resumeTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Resume deleted successfully')
        await fetchResumes()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete resume')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message)
    }
  }

  const setPrimaryResume = async (resumeId, resumeTitle) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/primary`, {
        method: 'PUT'
      })

      if (response.ok) {
        toast.success(`"${resumeTitle}" set as primary resume`)
        await fetchResumes()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update primary resume')
      }
    } catch (error) {
      console.error('Primary resume error:', error)
      toast.error(error.message)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getExperienceColor = (level) => {
    return experienceLevels.find(l => l.value === level)?.color || 'bg-gray-100 text-gray-800'
  }

  const getExperienceLabel = (level) => {
    return experienceLevels.find(l => l.value === level)?.label || level
  }

  const resetUploadForm = () => {
    setResumeForm({ title: '', description: '', experienceLevel: 'MID_LEVEL' })
    setShowUploadForm(false)
  }

  if (!userId) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">User ID is required to manage resumes</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Resume Library</h3>
          <p className="text-sm text-secondary-600">
            Manage multiple resumes for different experience levels and roles
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="btn btn-primary btn-sm"
          disabled={isUploading}
        >
          <Plus className="w-4 h-4" />
          Add Resume
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="text-center py-8">
            <div className="loading-spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
            <p className="text-secondary-600">Loading resumes...</p>
          </div>
        </div>
      )}

      {/* Resume List */}
      {!isLoading && (
        <div className="space-y-4">
          <AnimatePresence>
            {resumes.map((resume, index) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`card card-compact ${resume.isPrimary ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-secondary-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-secondary-900">{resume.title}</h4>
                        {resume.isPrimary && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" title="Primary Resume" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-secondary-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(resume.experienceLevel)}`}>
                          {getExperienceLabel(resume.experienceLevel)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </div>
                        <span>{formatFileSize(resume.fileSize)}</span>
                      </div>
                      
                      {resume.description && (
                        <p className="text-sm text-secondary-600 mt-1">{resume.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!resume.isPrimary && (
                      <button
                        onClick={() => setPrimaryResume(resume.id, resume.title)}
                        className="btn btn-ghost btn-sm text-yellow-600 hover:text-yellow-700"
                        title="Set as primary resume"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => window.open(resume.url, '_blank')}
                      className="btn btn-ghost btn-sm text-secondary-600 hover:text-secondary-700"
                      title="View resume"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <a
                      href={resume.url}
                      download={resume.originalName}
                      className="btn btn-ghost btn-sm text-secondary-600 hover:text-secondary-700"
                      title="Download resume"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    
                    <button
                      onClick={() => deleteResume(resume.id, resume.title)}
                      className="btn btn-ghost btn-sm text-error-600 hover:text-error-700"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {resumes.length === 0 && !isLoading && (
            <div className="card">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-secondary-400" />
                </div>
                <h4 className="text-lg font-medium text-secondary-900 mb-2">No resumes uploaded</h4>
                <p className="text-secondary-600 mb-4">Upload your first resume to get started</p>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Upload Resume
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Form Modal */}
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
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Upload New Resume</h3>
                <button
                  onClick={resetUploadForm}
                  className="btn btn-ghost btn-sm"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Resume Title */}
                <div className="form-group">
                  <label className="form-label required">Resume Title</label>
                  <input
                    value={resumeForm.title}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., Senior Developer Resume"
                    disabled={isUploading}
                  />
                </div>

                {/* Experience Level */}
                <div className="form-group">
                  <label className="form-label required">Experience Level</label>
                  <select
                    value={resumeForm.experienceLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value
                      setResumeForm(prev => ({ 
                        ...prev, 
                        experienceLevel: newLevel,
                        title: prev.title || `${experienceLevels.find(l => l.value === newLevel)?.label} Resume`
                      }))
                    }}
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

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    value={resumeForm.description}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of this resume version..."
                    disabled={isUploading}
                  />
                </div>

                {/* File Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={!isUploading ? openFileDialog : undefined}
                  className={`
                    border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
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
                    disabled={isUploading}
                  />
                  
                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="loading-spinner w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-primary-900">Uploading...</p>
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
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">
                          {isDragging ? 'Drop your resume here' : 'Choose or drop resume file'}
                        </p>
                        <p className="text-sm text-secondary-600">
                          PDF, DOC, DOCX, TXT (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
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
                    onClick={openFileDialog}
                    disabled={isUploading || !resumeForm.title.trim()}
                    className="btn btn-primary flex-1"
                  >
                    <Upload className="w-4 h-4" />
                    {resumeForm.title.trim() ? 'Upload File' : 'Enter Title First'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}