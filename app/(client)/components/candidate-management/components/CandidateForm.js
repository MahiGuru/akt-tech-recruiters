'use client'

import { useState } from 'react'
import { Plus, X, Upload, FileText } from 'lucide-react'
import { CANDIDATE_STATUSES, EXPERIENCE_LEVELS, FILE_UPLOAD } from '../utils/constants'
import { validateFile } from '../utils/helpers'
import toast from 'react-hot-toast'

const CandidateForm = ({ 
  candidate, 
  onSubmit, 
  onCancel, 
  teamMembers, 
  isAdmin, 
  isUploading 
}) => {
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    location: candidate?.location || '',
    experience: candidate?.experience?.toString() || '',
    skills: candidate?.skills || [],
    bio: candidate?.bio || '',
    source: candidate?.source || '',
    notes: candidate?.notes || '',
    status: candidate?.status || 'ACTIVE',
    addedById: candidate?.addedById || ''
  })
  
  const [newSkill, setNewSkill] = useState('')
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeData, setResumeData] = useState({
    title: '',
    description: '',
    experienceLevel: 'MID_LEVEL'
  })
  const [isDragging, setIsDragging] = useState(false)

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const handleFileSelect = (selectedFile) => {
    const validation = validateFile(selectedFile, FILE_UPLOAD.ACCEPTED_TYPES, FILE_UPLOAD.MAX_SIZE)
    
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }
    
    setResumeFile(selectedFile)
    if (!resumeData.title) {
      setResumeData(prev => ({ 
        ...prev, 
        title: selectedFile.name.replace(/\.[^/.]+$/, '') 
      }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, resumeFile ? { file: resumeFile, data: resumeData } : null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
          <input
            type="number"
            min="0"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            {CANDIDATE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a skill"
            disabled={isUploading}
          />
          <button 
            type="button" 
            onClick={addSkill} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isUploading}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {skill}
                <button 
                  type="button" 
                  onClick={() => removeSkill(skill)} 
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Additional Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
        <input
          type="text"
          value={formData.source}
          onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., LinkedIn, Referral"
          disabled={isUploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isUploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isUploading}
        />
      </div>

      {/* Admin Assignment */}
      {isAdmin && !candidate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Recruiter</label>
          <select
            value={formData.addedById}
            onChange={(e) => setFormData(prev => ({ ...prev, addedById: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            <option value="">Assign to myself</option>
            {teamMembers.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.user.name} ({member.recruiterType})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resume Upload Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume Upload (Optional)</h4>
        
        {/* File Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${
            isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            accept={FILE_UPLOAD.ACCEPTED_EXTENSIONS}
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            className="sr-only"
            id="candidate-resume-file"
            disabled={isUploading}
          />
          <label htmlFor="candidate-resume-file" className="cursor-pointer">
            {resumeFile ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-green-600 mx-auto" />
                <p className="font-medium text-green-900">{resumeFile.name}</p>
                <p className="text-sm text-green-600">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setResumeFile(null)
                    setResumeData({ title: '', description: '', experienceLevel: 'MID_LEVEL' })
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                  disabled={isUploading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">Upload Resume</p>
                  <p className="text-sm text-gray-600">Drag and drop or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT - Max 5MB</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Resume Details (only show if file selected) */}
        {resumeFile && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Title</label>
              <input
                type="text"
                value={resumeData.title}
                onChange={(e) => setResumeData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior Developer Resume"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={resumeData.experienceLevel}
                onChange={(e) => setResumeData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              >
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={resumeData.description}
                onChange={(e) => setResumeData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Brief description of this resume..."
                disabled={isUploading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={isUploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {candidate ? 'Updating...' : 'Adding...'}
            </div>
          ) : (
            candidate ? 'Update Candidate' : 'Add Candidate'
          )}
        </button>
      </div>
    </form>
  )
}

export default CandidateForm