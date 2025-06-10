'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  FileText, 
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function JobApplicationModal({ 
  job, 
  isOpen, 
  onClose, 
  userId 
}) {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchResumes()
    }
  }, [isOpen, userId])

  const fetchResumes = async () => {
    try {
      const response = await fetch(`/api/resumes?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
        
        // Auto-select primary resume
        const primaryResume = data.find(r => r.isPrimary)
        if (primaryResume) {
          setSelectedResumeId(primaryResume.id)
        }
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedResumeId) {
      toast.error('Please select a resume')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          employeeId: userId,
          resumeId: selectedResumeId,
          coverLetter: coverLetter.trim() || null
        })
      })

      if (response.ok) {
        toast.success('Application submitted successfully!')
        onClose()
        setCoverLetter('')
        setSelectedResumeId('')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit application')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getExperienceColor = (level) => {
    const colors = {
      'ENTRY_LEVEL': 'bg-green-100 text-green-800',
      'MID_LEVEL': 'bg-blue-100 text-blue-800',
      'SENIOR_LEVEL': 'bg-purple-100 text-purple-800',
      'EXECUTIVE': 'bg-red-100 text-red-800',
      'FREELANCE': 'bg-yellow-100 text-yellow-800',
      'INTERNSHIP': 'bg-gray-100 text-gray-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getExperienceLabel = (level) => {
    return level.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 mb-1">
                Apply for {job.title}
              </h2>
              <p className="text-secondary-600">
                {job.company} • {job.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Selection */}
            <div className="form-group">
              <label className="form-label required">Select Resume</label>
              
              {resumes.length === 0 ? (
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-center gap-2 text-warning-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">No resumes found</span>
                  </div>
                  <p className="text-sm text-warning-600 mt-1">
                    Please upload a resume before applying for jobs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {resumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedResumeId === resume.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-secondary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === resume.id}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-secondary-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-secondary-900">
                              {resume.title}
                            </h4>
                            {resume.isPrimary && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(resume.experienceLevel)}`}>
                              {getExperienceLabel(resume.experienceLevel)}
                            </span>
                            <span className="text-secondary-500">
                              {new Date(resume.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {selectedResumeId === resume.id && (
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="form-group">
              <label htmlFor="coverLetter" className="form-label">
                Cover Letter (Optional)
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="input-field"
                rows={6}
                placeholder="Write a brief cover letter to introduce yourself and explain why you're interested in this position..."
              />
              <p className="text-xs text-secondary-500 mt-1">
                A personalized cover letter can help you stand out
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedResumeId || resumes.length === 0}
                className="btn btn-primary flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}