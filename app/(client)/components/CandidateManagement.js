// app/(client)/components/CandidateManagement.js - Updated with Interview Feedback
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  Users, UserPlus, Search, Edit, Trash2, Eye, FileText, Mail, Phone, MapPin, 
  Briefcase, Plus, X, ChevronDown, ChevronUp, Upload, Download, Star, Calendar,
  Clock, Video, CheckCircle, AlertCircle, Timer, User, MessageSquare, ThumbsUp,
  Award, Target
} from 'lucide-react'

// Import the new feedback modal
import InterviewFeedbackModal from './InterviewFeedbackModal'

// Constants
const CANDIDATE_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800' }
]

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level' },
  { value: 'MID_LEVEL', label: 'Mid Level' },
  { value: 'SENIOR_LEVEL', label: 'Senior Level' },
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' }
]

// Interview Status Colors
const getInterviewStatusColor = (status) => {
  const colors = {
    'SCHEDULED': 'bg-blue-100 text-blue-800 border-blue-200',
    'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'COMPLETED': 'bg-purple-100 text-purple-800 border-purple-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
    'RESCHEDULED': 'bg-orange-100 text-orange-800 border-orange-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Interview Scheduling Modal Component (keeping existing)
const InterviewSchedulingModal = ({ isOpen, onClose, candidate, onScheduleSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    meetingLink: '',
    notes: ''
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInterviewForm({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        meetingLink: '',
        notes: ''
      })
    }
  }, [isOpen])

  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    
    if (!interviewForm.title || !interviewForm.scheduledAt) {
      toast.error('Title and scheduled time are required')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          ...interviewForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Interview scheduled successfully!')
        onScheduleSuccess(data.interview)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to schedule interview')
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">Schedule Interview</h3>
              <p className="text-blue-100">with {candidate?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleScheduleInterview} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Title *
                </label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technical Interview, HR Round"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={interviewForm.duration}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={interviewForm.description}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Interview details, topics to cover, etc."
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Internal notes about the interview"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Scheduling...
                  </div>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Schedule Interview
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Candidate Form Component (keeping existing structure)
const CandidateForm = ({ candidate, onSubmit, onCancel, teamMembers, isAdmin, isUploading }) => {
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

  const acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  const maxSize = 5 * 1024 * 1024 // 5MB

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
    if (!acceptedTypes.includes(selectedFile.type)) {
      toast.error('Only PDF, DOC, DOCX, and TXT files are allowed')
      return
    }
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }
    setResumeFile(selectedFile)
    if (!resumeData.title) {
      setResumeData(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, '') }))
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          />
          <button type="button" onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="text-blue-600 hover:text-blue-800">
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
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
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
          }`}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            className="sr-only"
            id="candidate-resume-file"
          />
          <label htmlFor="candidate-resume-file" className="cursor-pointer">
            {resumeFile ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-green-600 mx-auto" />
                <p className="font-medium text-green-900">{resumeFile.name}</p>
                <p className="text-sm text-green-600">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null)
                    setResumeData({ title: '', description: '', experienceLevel: 'MID_LEVEL' })
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={resumeData.experienceLevel}
                onChange={(e) => setResumeData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

// Main Component
const CandidateManagement = () => {
  const { data: session } = useSession()
  const isAdmin = session?.user?.recruiterProfile?.recruiterType === 'ADMIN'

  // State
  const [candidates, setCandidates] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recruiterFilter, setRecruiterFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [expandedCards, setExpandedCards] = useState(new Set())

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false) // NEW
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null) // NEW
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API Functions
  const fetchData = async () => {
    try {
      setLoading(true)
      const [candidatesRes, teamRes] = await Promise.all([
        fetch('/api/recruiter/candidates'),
        isAdmin ? fetch('/api/recruiter/team') : Promise.resolve({ ok: true, json: () => ({ teamMembers: [] }) })
      ])

      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json()
        setCandidates(candidatesData.candidates || [])
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.teamMembers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumes = async (candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/resumes?candidateId=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
    }
  }

  // Event Handlers
  const handleAddCandidate = async (formData, resumeInfo) => {
    try {
      setIsSubmitting(true)
      
      // First create the candidate
      const candidateResponse = await fetch('/api/recruiter/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!candidateResponse.ok) {
        const error = await candidateResponse.json()
        throw new Error(error.message || 'Failed to add candidate')
      }

      const candidateResult = await candidateResponse.json()
      const newCandidate = candidateResult.candidate

      // If resume is provided, upload it
      if (resumeInfo) {
        const resumeFormData = new FormData()
        resumeFormData.append('resume', resumeInfo.file)
        resumeFormData.append('candidateId', newCandidate.id)
        resumeFormData.append('title', resumeInfo.data.title || resumeInfo.file.name)
        resumeFormData.append('description', resumeInfo.data.description || '')
        resumeFormData.append('experienceLevel', resumeInfo.data.experienceLevel)
        resumeFormData.append('originalName', resumeInfo.file.name)

        const resumeResponse = await fetch('/api/recruiter/resumes', {
          method: 'POST',
          body: resumeFormData
        })

        if (!resumeResponse.ok) {
          console.warn('Candidate created but resume upload failed')
          toast.warning('Candidate added but resume upload failed')
        } else {
          toast.success('Candidate and resume added successfully!')
        }
      } else {
        toast.success('Candidate added successfully!')
      }

      setShowAddModal(false)
      fetchData()
    } catch (error) {
      console.error('Error adding candidate:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCandidate = async (formData, resumeInfo) => {
    try {
      setIsSubmitting(true)
      
      // Update candidate
      const candidateResponse = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate.id, ...formData })
      })

      if (!candidateResponse.ok) {
        const error = await candidateResponse.json()
        throw new Error(error.message || 'Failed to update candidate')
      }

      // If resume is provided, upload it
      if (resumeInfo) {
        const resumeFormData = new FormData()
        resumeFormData.append('resume', resumeInfo.file)
        resumeFormData.append('candidateId', selectedCandidate.id)
        resumeFormData.append('title', resumeInfo.data.title || resumeInfo.file.name)
        resumeFormData.append('description', resumeInfo.data.description || '')
        resumeFormData.append('experienceLevel', resumeInfo.data.experienceLevel)
        resumeFormData.append('originalName', resumeInfo.file.name)

        const resumeResponse = await fetch('/api/recruiter/resumes', {
          method: 'POST',
          body: resumeFormData
        })

        if (!resumeResponse.ok) {
          console.warn('Candidate updated but resume upload failed')
          toast.warning('Candidate updated but resume upload failed')
        } else {
          toast.success('Candidate and resume updated successfully!')
        }
      } else {
        toast.success('Candidate updated successfully!')
      }

      setShowEditModal(false)
      setSelectedCandidate(null)
      fetchData()
    } catch (error) {
      console.error('Error updating candidate:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}?`)) return

    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Candidate deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete candidate')
      }
    } catch (error) {
      console.error('Error deleting candidate:', error)
      toast.error('Failed to delete candidate')
    }
  }

  const handleStatusUpdate = async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      })

      if (response.ok) {
        const statusLabel = CANDIDATE_STATUSES.find(s => s.value === newStatus)?.label
        toast.success(`${candidateName}'s status updated to ${statusLabel}`)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleViewDetails = async (candidate) => {
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidate.id}`)
      if (response.ok) {
        const detailedCandidate = await response.json()
        setSelectedCandidate(detailedCandidate)
        setShowDetailModal(true)
        fetchResumes(candidate.id)
      } else {
        toast.error('Failed to load candidate details')
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to load candidate details')
    }
  }

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate)
    setShowInterviewModal(true)
  }

  // NEW: Handle interview feedback
  const handleInterviewFeedback = (interview, candidate) => {
    setSelectedInterview(interview)
    setSelectedCandidate(candidate)
    setShowFeedbackModal(true)
  }

  const handleInterviewScheduleSuccess = (newInterview) => {
    // Update the candidate's interviews in local state
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => 
        candidate.id === newInterview.candidateId 
          ? { 
              ...candidate, 
              interviews: [...(candidate.interviews || []), newInterview]
            }
          : candidate
      )
    )
    
    // Also update selectedCandidate if it's the same candidate
    if (selectedCandidate?.id === newInterview.candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        interviews: [...(prev.interviews || []), newInterview]
      }))
    }
  }

  // NEW: Handle feedback submission success
  const handleFeedbackSubmitSuccess = (updatedInterview) => {
    // Update candidates with the updated interview
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => 
        candidate.id === updatedInterview.candidateId 
          ? { 
              ...candidate, 
              interviews: candidate.interviews.map(interview =>
                interview.id === updatedInterview.id ? updatedInterview : interview
              )
            }
          : candidate
      )
    )
    
    // Also update selectedCandidate if it's the same candidate
    if (selectedCandidate?.id === updatedInterview.candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        interviews: prev.interviews.map(interview =>
          interview.id === updatedInterview.id ? updatedInterview : interview
        )
      }))
    }

    setShowFeedbackModal(false)
    setSelectedInterview(null)
  }

  const handleDeleteResume = async (resumeId, resumeTitle) => {
    if (!confirm(`Delete "${resumeTitle}"?`)) return

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Resume deleted successfully')
        fetchResumes(selectedCandidate.id)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete resume')
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast.error('Failed to delete resume')
    }
  }

  // Utility Functions
  const toggleExpanded = (candidateId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  const getStatusColor = (status) => {
    return CANDIDATE_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  // Get upcoming interviews for a candidate
  const getUpcomingInterviews = (candidate) => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => 
      new Date(interview.scheduledAt) > new Date() && 
      ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    )
  }

  // NEW: Get completed/past interviews for feedback
  const getCompletedInterviews = (candidate) => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => {
      const interviewTime = new Date(interview.scheduledAt)
      const now = new Date()
      const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
      
      return interviewEndTime <= now && interview.status !== 'CANCELLED'
    })
  }

  // NEW: Get interviews eligible for feedback (completed but no feedback yet)
  const getInterviewsNeedingFeedback = (candidate) => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => {
      const interviewTime = new Date(interview.scheduledAt)
      const now = new Date()
      const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
      
      return interviewEndTime <= now && 
             interview.status !== 'CANCELLED' && 
             interview.status !== 'COMPLETED' && // Not yet marked as completed with feedback
             !interview.feedback // No feedback submitted yet
    })
  }

  // Format time until interview
  const getTimeUntilInterview = (scheduledAt) => {
    const now = new Date()
    const interviewTime = new Date(scheduledAt)
    const diff = interviewTime - now
    
    if (diff < 0) return 'Past'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Filtered and Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
        const matchesRecruiter = recruiterFilter === 'all' || candidate.addedById === recruiterFilter
        return matchesSearch && matchesStatus && matchesRecruiter
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.createdAt) - new Date(a.createdAt)
          case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt)
          case 'name': return a.name.localeCompare(b.name)
          case 'status': return a.status.localeCompare(b.status)
          default: return 0
        }
      })
  }, [candidates, searchTerm, statusFilter, recruiterFilter, sortBy])

  // Effects
  useEffect(() => {
    fetchData()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'All Team Candidates' : 'Manage Candidates'}
          </h2>
          <p className="text-gray-600">
            {isAdmin 
              ? `View and manage candidates from all team members (${filteredCandidates.length} total)`
              : `Add, edit, and track your candidates (${filteredCandidates.length} total)`
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {CANDIDATE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {isAdmin && (
            <select
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
            >
              <option value="all">All Recruiters</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || recruiterFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Start by adding your first candidate'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add First Candidate
            </button>
          </div>
        ) : (
          filteredCandidates.map((candidate, index) => {
            const upcomingInterviews = getUpcomingInterviews(candidate)
            const interviewsNeedingFeedback = getInterviewsNeedingFeedback(candidate) // NEW
            
            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status.replace('_', ' ')}
                          </span>
                          {isAdmin && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {candidate.addedBy?.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {candidate.email}
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {candidate.phone}
                            </div>
                          )}
                          {candidate.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {candidate.location}
                            </div>
                          )}
                        </div>
                        
                        {/* Upcoming Interview Details */}
                        {upcomingInterviews.length > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <Calendar className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-green-800">
                                  {upcomingInterviews.length} Upcoming Interview{upcomingInterviews.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <Timer className="w-3 h-3 inline mr-1" />
                                {getTimeUntilInterview(upcomingInterviews[0].scheduledAt)}
                              </span>
                            </div>
                            
                            {/* Next Interview Details */}
                            <div className="space-y-2">
                              {upcomingInterviews.slice(0, 2).map((interview, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-md border border-green-100">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-gray-900">{interview.title}</h5>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                                        {interview.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(interview.scheduledAt).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: new Date(interview.scheduledAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                        })}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}</span>
                                      </div>
                                      <span>({interview.duration} min)</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {interview.meetingLink && (
                                      <a 
                                        href={interview.meetingLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Join Meeting"
                                      >
                                        <Video className="w-3 h-3" />
                                      </a>
                                    )}
                                    <div className="text-right">
                                      <div className="text-xs font-medium text-blue-600">
                                        {getTimeUntilInterview(interview.scheduledAt)}
                                      </div>
                                      <div className="text-xs text-gray-500">remaining</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {upcomingInterviews.length > 2 && (
                                <div className="text-center">
                                  <span className="text-xs text-gray-500">
                                    +{upcomingInterviews.length - 2} more interview{upcomingInterviews.length - 2 > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* NEW: Interviews Needing Feedback */}
                        {interviewsNeedingFeedback.length > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                  <MessageSquare className="w-3 h-3 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-orange-800">
                                  {interviewsNeedingFeedback.length} Interview{interviewsNeedingFeedback.length > 1 ? 's' : ''} Need Feedback
                                </span>
                              </div>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                Action Required
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {interviewsNeedingFeedback.slice(0, 2).map((interview, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-md border border-orange-100">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-gray-900">{interview.title}</h5>
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                        Completed
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                                      <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleInterviewFeedback(interview, candidate)}
                                    className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    Add Feedback
                                  </button>
                                </div>
                              ))}
                              
                              {interviewsNeedingFeedback.length > 2 && (
                                <div className="text-center">
                                  <span className="text-xs text-gray-500">
                                    +{interviewsNeedingFeedback.length - 2} more interview{interviewsNeedingFeedback.length - 2 > 1 ? 's' : ''} need feedback
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleScheduleInterview(candidate)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                        title="Schedule Interview"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewDetails(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCandidate(candidate)
                          setShowEditModal(true)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpanded(candidate.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                      >
                        {expandedCards.has(candidate.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedCards.has(candidate.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                            {candidate.skills && candidate.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 5).map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.length > 5 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    +{candidate.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No skills listed</p>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span>{candidate.resumes?.length || 0} resumes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{candidate.interviews?.length || 0} interviews</span>
                                {upcomingInterviews.length > 0 && (
                                  <span className="text-green-600">({upcomingInterviews.length} upcoming)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <span>{candidate.applications?.length || 0} applications</span>
                              </div>
                              {/* NEW: Feedback stats */}
                              {interviewsNeedingFeedback.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-orange-400" />
                                  <span className="text-orange-600">{interviewsNeedingFeedback.length} need feedback</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                            <div className="space-y-2">
                              <select
                                value={candidate.status}
                                onChange={(e) => handleStatusUpdate(candidate.id, e.target.value, candidate.name)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {CANDIDATE_STATUSES.map(status => (
                                  <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleScheduleInterview(candidate)}
                                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Schedule
                                </button>
                                <button
                                  onClick={() => handleViewDetails(candidate)}
                                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  View Details
                                </button>
                                {(isAdmin || candidate.addedById === session?.user?.id) && (
                                  <button
                                    onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interview List for this candidate */}
                        {candidate.interviews && candidate.interviews.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3">
                              Interview Schedule ({candidate.interviews.length})
                            </h4>
                            <div className="space-y-2">
                              {candidate.interviews.slice(0, 3).map((interview, idx) => {
                                const isUpcoming = new Date(interview.scheduledAt) > new Date()
                                const timeInfo = isUpcoming 
                                  ? getTimeUntilInterview(interview.scheduledAt)
                                  : 'Past'
                                const needsFeedback = getInterviewsNeedingFeedback(candidate).some(i => i.id === interview.id)
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${
                                        interview.status === 'SCHEDULED' ? 'bg-blue-500' :
                                        interview.status === 'CONFIRMED' ? 'bg-green-500' :
                                        interview.status === 'COMPLETED' ? 'bg-purple-500' :
                                        interview.status === 'CANCELLED' ? 'bg-red-500' :
                                        'bg-gray-500'
                                      }`}></div>
                                      <div>
                                        <p className="font-medium text-gray-900">{interview.title}</p>
                                        <p className="text-gray-600">
                                          {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                                          {new Date(interview.scheduledAt).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                                        {interview.status.replace('_', ' ')}
                                      </span>
                                      {/* NEW: Show feedback button for eligible interviews */}
                                      {needsFeedback && (
                                        <button
                                          onClick={() => handleInterviewFeedback(interview, candidate)}
                                          className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 flex items-center gap-1"
                                          title="Add Interview Feedback"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          Feedback
                                        </button>
                                      )}
                                      {isUpcoming && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                          <Timer className="w-3 h-3 inline mr-1" />
                                          {timeInfo}
                                        </span>
                                      )}
                                      {interview.meetingLink && (
                                        <a 
                                          href={interview.meetingLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700"
                                          title="Join Meeting"
                                        >
                                          <Video className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                              {candidate.interviews.length > 3 && (
                                <p className="text-sm text-gray-500 text-center">
                                  +{candidate.interviews.length - 3} more interviews
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Add New Candidate</h3>
              </div>
              <div className="p-6">
                <CandidateForm
                  onSubmit={handleAddCandidate}
                  onCancel={() => setShowAddModal(false)}
                  teamMembers={teamMembers}
                  isAdmin={isAdmin}
                  isUploading={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Candidate Modal */}
      <AnimatePresence>
        {showEditModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Edit {selectedCandidate.name}</h3>
              </div>
              <div className="p-6">
                <CandidateForm
                  candidate={selectedCandidate}
                  onSubmit={handleUpdateCandidate}
                  onCancel={() => {
                    setShowEditModal(false)
                    setSelectedCandidate(null)
                  }}
                  teamMembers={teamMembers}
                  isAdmin={isAdmin}
                  isUploading={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Scheduling Modal */}
      <AnimatePresence>
        {showInterviewModal && (
          <InterviewSchedulingModal
            isOpen={showInterviewModal}
            onClose={() => {
              setShowInterviewModal(false)
              setSelectedCandidate(null)
            }}
            candidate={selectedCandidate}
            onScheduleSuccess={handleInterviewScheduleSuccess}
          />
        )}
      </AnimatePresence>

      {/* NEW: Interview Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && selectedInterview && selectedCandidate && (
          <InterviewFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => {
              setShowFeedbackModal(false)
              setSelectedInterview(null)
              setSelectedCandidate(null)
            }}
            interview={selectedInterview}
            candidate={selectedCandidate}
            onFeedbackSubmit={handleFeedbackSubmitSuccess}
          />
        )}
      </AnimatePresence>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                    <p className="text-blue-100">{selectedCandidate.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedCandidate(null)
                      setResumes([])
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      {selectedCandidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.phone}</span>
                        </div>
                      )}
                      {selectedCandidate.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Professional Details</h4>
                    <div className="space-y-2">
                      {selectedCandidate.experience && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.experience} years experience</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Added by {selectedCandidate.addedBy?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interviews Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      Interviews ({selectedCandidate.interviews?.length || 0})
                    </h4>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setShowInterviewModal(true)
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Interview
                    </button>
                  </div>

                  {!selectedCandidate.interviews || selectedCandidate.interviews.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h5 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h5>
                      <p className="text-gray-600 mb-4">Schedule the first interview with this candidate</p>
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          setShowInterviewModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Schedule Interview
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCandidate.interviews.map((interview, index) => {
                        const isUpcoming = new Date(interview.scheduledAt) > new Date()
                        const timeInfo = isUpcoming 
                          ? getTimeUntilInterview(interview.scheduledAt)
                          : 'Past'
                        const needsFeedback = getInterviewsNeedingFeedback(selectedCandidate).some(i => i.id === interview.id)
                        
                        return (
                          <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h6 className="font-medium text-gray-900">{interview.title}</h6>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                                    {interview.status.replace('_', ' ')}
                                  </span>
                                  {/* NEW: Show feedback indicator */}
                                  {needsFeedback && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                      <MessageSquare className="w-3 h-3 inline mr-1" />
                                      Needs Feedback
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                                  <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>{interview.duration} min</span>
                                  {isUpcoming && (
                                    <span className="text-green-600">in {timeInfo}</span>
                                  )}
                                </div>
                                {interview.description && (
                                  <p className="text-sm text-gray-600 mt-1">{interview.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* NEW: Add feedback button */}
                              {needsFeedback && (
                                <button
                                  onClick={() => {
                                    setShowDetailModal(false)
                                    handleInterviewFeedback(interview, selectedCandidate)
                                  }}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-md"
                                  title="Add Feedback"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              )}
                              {interview.meetingLink && (
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                  title="Join Meeting"
                                >
                                  <Video className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Resumes Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Resumes ({resumes.length})</h4>
                  </div>

                  {resumes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h5 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h5>
                      <p className="text-gray-600">Use the Edit button to add resumes for this candidate</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resumes.map((resume, index) => (
                        <div key={resume.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h6 className="font-medium text-gray-900">{resume.title || resume.originalName}</h6>
                                {resume.isPrimary && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{resume.experienceLevel?.replace('_', ' ').toLowerCase()}</span>
                                <span>{(resume.fileSize / 1024).toFixed(1)} KB</span>
                                <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(resume.url, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={resume.url}
                              download
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {(isAdmin || selectedCandidate.addedById === session?.user?.id) && (
                              <button
                                onClick={() => handleDeleteResume(resume.id, resume.title || resume.originalName)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio and Notes */}
                {(selectedCandidate.bio || selectedCandidate.notes) && (
                  <div className="space-y-4">
                    {selectedCandidate.bio && (
                      <div>
                        <h4 className="text-lg font-semibold mb-2">Bio</h4>
                        <p className="text-gray-600">{selectedCandidate.bio}</p>
                      </div>
                    )}
                    {selectedCandidate.notes && (
                      <div>
                        <h4 className="text-lg font-semibold mb-2">Notes</h4>
                        <p className="text-gray-600">{selectedCandidate.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CandidateManagement