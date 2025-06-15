'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Upload,
  FileText,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  Clock,
  Video,
  Bell,
  CalendarDays,
  Star,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import InterviewManagement from './InterviewManagement'

const experienceLevels = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level', color: 'bg-green-100 text-green-800' },
  { value: 'MID_LEVEL', label: 'Mid Level', color: 'bg-blue-100 text-blue-800' },
  { value: 'SENIOR_LEVEL', label: 'Senior Level', color: 'bg-purple-100 text-purple-800' },
  { value: 'EXECUTIVE', label: 'Executive', color: 'bg-red-100 text-red-800' },
  { value: 'FREELANCE', label: 'Freelance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'INTERNSHIP', label: 'Internship', color: 'bg-gray-100 text-gray-800' }
]

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [stats, setStats] = useState({})

  // File upload refs
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  // Form states
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: [],
    bio: '',
    source: '',
    notes: ''
  })

  const [editCandidateForm, setEditCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: [],
    bio: '',
    source: '',
    notes: '',
    status: 'ACTIVE'
  })

  // Resume upload states
  const [selectedResumes, setSelectedResumes] = useState([])
  const [editSelectedResumes, setEditSelectedResumes] = useState([])
  const [isUploadingResumes, setIsUploadingResumes] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const [applicationForm, setApplicationForm] = useState({
    selectedJobs: [],
    coverLetter: '',
    resumeUsed: ''
  })

  const [newSkill, setNewSkill] = useState('')
  const [editNewSkill, setEditNewSkill] = useState('')

  const acceptedTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  }

  const maxFileSize = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    fetchCandidates()
    fetchJobs()
  }, [])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recruiter/candidates')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates)
        setStats(data.stats)
      } else {
        toast.error('Failed to load candidates')
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error('Failed to load candidates')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.filter(job => job.isActive))
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
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

  const handleFileSelect = (files, isEdit = false) => {
    const fileList = Array.from(files)
    const validFiles = []

    fileList.forEach(file => {
      try {
        validateFile(file)
        
        // Auto-generate title and experience level
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        const title = nameWithoutExt.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim()
        
        validFiles.push({
          file,
          title: title || 'Resume',
          description: '',
          experienceLevel: 'MID_LEVEL'
        })
      } catch (error) {
        toast.error(error.message)
      }
    })

    if (isEdit) {
      setEditSelectedResumes(prev => [...prev, ...validFiles])
    } else {
      setSelectedResumes(prev => [...prev, ...validFiles])
    }
  }

  const removeSelectedResume = (index, isEdit = false) => {
    if (isEdit) {
      setEditSelectedResumes(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedResumes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateResumeData = (index, field, value, isEdit = false) => {
    const updateFunction = isEdit ? setEditSelectedResumes : setSelectedResumes
    updateFunction(prev => prev.map((resume, i) => 
      i === index ? { ...resume, [field]: value } : resume
    ))
  }

  const uploadResumesForCandidate = async (candidateId, resumeFiles) => {
    if (resumeFiles.length === 0) return []

    const uploadResults = []
    setIsUploadingResumes(true)

    for (let i = 0; i < resumeFiles.length; i++) {
      const resumeData = resumeFiles[i]
      const file = resumeData.file
      
      try {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'uploading', progress: 0 }
        }))

        const formData = new FormData()
        formData.append('resume', file)
        formData.append('candidateId', candidateId)
        formData.append('title', resumeData.title)
        formData.append('description', resumeData.description || '')
        formData.append('experienceLevel', resumeData.experienceLevel)
        formData.append('originalName', file.name)

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
        uploadResults.push({ file: file.name, success: true, data: result.resume })
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'success', progress: 100 }
        }))

      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error)
        uploadResults.push({ file: file.name, success: false, error: error.message })
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'error', progress: 0, error: error.message }
        }))
      }
    }

    setIsUploadingResumes(false)
    return uploadResults
  }

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    
    if (!candidateForm.name || !candidateForm.email) {
      toast.error('Name and email are required')
      return
    }

    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Candidate added successfully!')
        
        // Upload resumes if any
        if (selectedResumes.length > 0) {
          const uploadResults = await uploadResumesForCandidate(data.candidate.id, selectedResumes)
          const successful = uploadResults.filter(r => r.success).length
          const failed = uploadResults.filter(r => !r.success).length
          
          if (successful > 0) {
            toast.success(`Uploaded ${successful} resume(s) for ${data.candidate.name}`)
          }
          if (failed > 0) {
            toast.error(`Failed to upload ${failed} resume(s)`)
          }
        }
        
        setCandidates([data.candidate, ...candidates])
        resetForm()
        setShowAddForm(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add candidate')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleEditCandidate = async (e) => {
    e.preventDefault()
    
    if (!editCandidateForm.name || !editCandidateForm.email) {
      toast.error('Name and email are required')
      return
    }

    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          ...editCandidateForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Candidate updated successfully!')
        
        // Upload new resumes if any
        if (editSelectedResumes.length > 0) {
          const uploadResults = await uploadResumesForCandidate(selectedCandidate.id, editSelectedResumes)
          const successful = uploadResults.filter(r => r.success).length
          const failed = uploadResults.filter(r => !r.success).length
          
          if (successful > 0) {
            toast.success(`Uploaded ${successful} new resume(s) for ${data.candidate.name}`)
          }
          if (failed > 0) {
            toast.error(`Failed to upload ${failed} resume(s)`)
          }
        }
        
        // Update candidates list
        setCandidates(candidates.map(c => c.id === selectedCandidate.id ? data.candidate : c))
        resetEditForm()
        setShowEditForm(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update candidate')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleApplyToJobs = async (e) => {
    e.preventDefault()
    
    if (applicationForm.selectedJobs.length === 0) {
      toast.error('Please select at least one job')
      return
    }

    try {
      const response = await fetch('/api/recruiter/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          jobIds: applicationForm.selectedJobs,
          coverLetter: applicationForm.coverLetter,
          resumeUsed: applicationForm.resumeUsed
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        setApplicationForm({ selectedJobs: [], coverLetter: '', resumeUsed: '' })
        setShowApplicationModal(false)
        fetchCandidates() // Refresh to show updated application counts
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to apply candidate')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!confirm(`Are you sure you want to delete "${candidateName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Candidate deleted successfully')
        setCandidates(candidates.filter(c => c.id !== candidateId))
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete candidate')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate)
    setShowInterviewModal(true)
  }

  const handleEditClick = (candidate) => {
    setSelectedCandidate(candidate)
    setEditCandidateForm({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      location: candidate.location || '',
      experience: candidate.experience || '',
      skills: candidate.skills || [],
      bio: candidate.bio || '',
      source: candidate.source || '',
      notes: candidate.notes || '',
      status: candidate.status || 'ACTIVE'
    })
    setEditSelectedResumes([])
    setShowEditForm(true)
  }

  const resetForm = () => {
    setCandidateForm({
      name: '',
      email: '',
      phone: '',
      location: '',
      experience: '',
      skills: [],
      bio: '',
      source: '',
      notes: ''
    })
    setSelectedResumes([])
    setUploadProgress({})
  }

  const resetEditForm = () => {
    setEditCandidateForm({
      name: '',
      email: '',
      phone: '',
      location: '',
      experience: '',
      skills: [],
      bio: '',
      source: '',
      notes: '',
      status: 'ACTIVE'
    })
    setEditSelectedResumes([])
    setUploadProgress({})
    setSelectedCandidate(null)
  }

  const addSkill = (isEdit = false) => {
    const skill = isEdit ? editNewSkill : newSkill
    const setSkill = isEdit ? setEditNewSkill : setNewSkill
    const form = isEdit ? editCandidateForm : candidateForm
    const setForm = isEdit ? setEditCandidateForm : setCandidateForm

    if (skill.trim() && !form.skills.includes(skill.trim())) {
      setForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
      setSkill('')
    }
  }

  const removeSkill = (skillToRemove, isEdit = false) => {
    const form = isEdit ? editCandidateForm : candidateForm
    const setForm = isEdit ? setEditCandidateForm : setCandidateForm

    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const getCandidateStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PLACED': 'bg-blue-100 text-blue-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'DO_NOT_CONTACT': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // NEW: Get upcoming interviews for a candidate
  const getUpcomingInterviews = (candidate) => {
    if (!candidate.interviews) return []
    
    const now = new Date()
    return candidate.interviews
      .filter(interview => {
        const interviewDate = new Date(interview.scheduledAt)
        return interviewDate > now && ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
  }

  // NEW: Format interview date and time
  const formatInterviewDateTime = (scheduledAt) => {
    const date = new Date(scheduledAt)
    const now = new Date()
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (diffDays === 0) {
      return { text: `Today ${timeStr}`, urgent: true }
    } else if (diffDays === 1) {
      return { text: `Tomorrow ${timeStr}`, urgent: true }
    } else if (diffDays <= 7) {
      const dayName = date.toLocaleDateString([], { weekday: 'short' })
      return { text: `${dayName} ${timeStr}`, urgent: false }
    } else {
      return { text: date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), urgent: false }
    }
  }

  // NEW: Get interview status color
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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = !statusFilter || candidate.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Management</h2>
          <p className="text-gray-600">Add and manage candidates for job opportunities</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
              <div className="text-sm text-gray-600">Total Candidates</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.statusDistribution?.find(s => s.status === 'ACTIVE')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.statusDistribution?.find(s => s.status === 'PLACED')?.count || 0}
              </div>
              <div className="text-sm text-gray-600">Placed</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {candidates.reduce((count, candidate) => {
                  return count + getUpcomingInterviews(candidate).length
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Upcoming Interviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates by name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PLACED">Placed</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Try adjusting your search criteria' : 'Start by adding your first candidate'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Add First Candidate
              </button>
            )}
          </div>
        ) : (
          filteredCandidates.map((candidate, index) => {
            const upcomingInterviews = getUpcomingInterviews(candidate)
            const hasUpcomingInterview = upcomingInterviews.length > 0
            const nextInterview = upcomingInterviews[0]

            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-white p-6 rounded-lg border hover:shadow-md transition-shadow ${
                  hasUpcomingInterview ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCandidateStatusColor(candidate.status)}`}>
                            {candidate.status.replace('_', ' ')}
                          </span>
                          {hasUpcomingInterview && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              Interview Scheduled
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
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
                          {candidate.experience && (
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {candidate.experience} years
                            </div>
                          )}
                        </div>

                        {/* NEW: Interview Information Display */}
                        {hasUpcomingInterview && (
                          <div className="mb-3 p-3 bg-white border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">{nextInterview.title}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(nextInterview.status)}`}>
                                  {nextInterview.status}
                                </span>
                              </div>
                              {nextInterview.meetingLink && (
                                <a
                                  href={nextInterview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  <Video className="w-3 h-3" />
                                  Join Meeting
                                </a>
                              )}
                            </div>
                            <div className="mt-2 text-sm">
                              <div className={`flex items-center gap-1 ${formatInterviewDateTime(nextInterview.scheduledAt).urgent ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                <Clock className="w-3 h-3" />
                                {formatInterviewDateTime(nextInterview.scheduledAt).text}
                                <span className="text-gray-500">
                                  ({nextInterview.duration} min)
                                </span>
                              </div>
                              {nextInterview.description && (
                                <p className="text-gray-600 mt-1">{nextInterview.description}</p>
                              )}
                            </div>
                            {upcomingInterviews.length > 1 && (
                              <div className="mt-2 text-xs text-blue-600">
                                +{upcomingInterviews.length - 1} more interview(s) scheduled
                              </div>
                            )}
                          </div>
                        )}

                        {candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
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
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {candidate.resumes?.length || 0} resume(s)
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {candidate.applications?.length || 0} application(s)
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            {candidate.interviews?.length || 0} interview(s)
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Added {new Date(candidate.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleScheduleInterview(candidate)}
                      className={`btn btn-ghost btn-sm ${hasUpcomingInterview ? 'text-blue-600 hover:text-blue-700' : 'text-purple-600 hover:text-purple-700'}`}
                      title={hasUpcomingInterview ? 'Manage interviews' : 'Schedule interview'}
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setShowApplicationModal(true)
                      }}
                      className="btn btn-primary btn-sm"
                      title="Apply to jobs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    
                    <button
                      className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleEditClick(candidate)}
                      className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                      title="Edit candidate"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                      className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                      title="Delete candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isUploadingResumes) {
                setShowAddForm(false)
                resetForm()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Add New Candidate</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="btn btn-ghost btn-sm"
                  disabled={isUploadingResumes}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label required">Name</label>
                      <input
                        type="text"
                        value={candidateForm.name}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Email</label>
                      <input
                        type="email"
                        value={candidateForm.email}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        value={candidateForm.phone}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-field"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        value={candidateForm.location}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, location: e.target.value }))}
                        className="input-field"
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={candidateForm.experience}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, experience: e.target.value }))}
                        className="input-field"
                        placeholder="5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Source</label>
                      <input
                        type="text"
                        value={candidateForm.source}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, source: e.target.value }))}
                        className="input-field"
                        placeholder="LinkedIn, Referral, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Skills</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="input-field flex-1"
                        placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="btn btn-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {candidateForm.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {candidateForm.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume Upload Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Resume Upload (Optional)</h4>
                  
                  {selectedResumes.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload resumes or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, TXT (max 5MB each)</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedResumes.map((resume, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">{resume.file.name}</span>
                              <span className="text-sm text-gray-500">
                                ({formatFileSize(resume.file.size)})
                              </span>
                            </div>
                            {!isUploadingResumes && (
                              <button
                                type="button"
                                onClick={() => removeSelectedResume(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="form-label">Resume Title</label>
                              <input
                                type="text"
                                value={resume.title}
                                onChange={(e) => updateResumeData(index, 'title', e.target.value)}
                                className="input-field"
                                placeholder="e.g., Senior Developer Resume"
                                disabled={isUploadingResumes}
                              />
                            </div>
                            <div>
                              <label className="form-label">Experience Level</label>
                              <select
                                value={resume.experienceLevel}
                                onChange={(e) => updateResumeData(index, 'experienceLevel', e.target.value)}
                                className="input-field"
                                disabled={isUploadingResumes}
                              >
                                {experienceLevels.map(level => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="form-label">Description (Optional)</label>
                            <textarea
                              value={resume.description}
                              onChange={(e) => updateResumeData(index, 'description', e.target.value)}
                              className="input-field"
                              rows={2}
                              placeholder="Brief description of this resume"
                              disabled={isUploadingResumes}
                            />
                          </div>

                          {/* Upload Progress */}
                          {uploadProgress[resume.file.name] && (
                            <div className="mt-3">
                              {uploadProgress[resume.file.name].status === 'uploading' && (
                                <div className="flex items-center gap-2">
                                  <div className="loading-spinner w-4 h-4" />
                                  <span className="text-sm text-blue-600">
                                    Uploading... {uploadProgress[resume.file.name].progress}%
                                  </span>
                                </div>
                              )}
                              {uploadProgress[resume.file.name].status === 'success' && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Uploaded successfully</span>
                                </div>
                              )}
                              {uploadProgress[resume.file.name].status === 'error' && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">{uploadProgress[resume.file.name].error}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {!isUploadingResumes && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add More Resumes
                        </button>
                      )}
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={Object.values(acceptedTypes).join(',')}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="sr-only"
                    multiple
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea
                        value={candidateForm.bio}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="input-field"
                        rows={3}
                        placeholder="Brief description of the candidate's background and expertise..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea
                        value={candidateForm.notes}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="input-field"
                        rows={2}
                        placeholder="Internal notes about the candidate..."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                    className="btn btn-secondary flex-1"
                    disabled={isUploadingResumes}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1"
                    disabled={isUploadingResumes}
                  >
                    {isUploadingResumes ? (
                      <div className="flex items-center gap-2">
                        <div className="loading-spinner w-4 h-4" />
                        Adding Candidate...
                      </div>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Candidate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Candidate Modal */}
      <AnimatePresence>
        {showEditForm && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isUploadingResumes) {
                setShowEditForm(false)
                resetEditForm()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Edit Candidate</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false)
                    resetEditForm()
                  }}
                  className="btn btn-ghost btn-sm"
                  disabled={isUploadingResumes}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditCandidate} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label required">Name</label>
                      <input
                        type="text"
                        value={editCandidateForm.name}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Email</label>
                      <input
                        type="email"
                        value={editCandidateForm.email}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        value={editCandidateForm.phone}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-field"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        value={editCandidateForm.location}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, location: e.target.value }))}
                        className="input-field"
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editCandidateForm.experience}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, experience: e.target.value }))}
                        className="input-field"
                        placeholder="5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        value={editCandidateForm.status}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, status: e.target.value }))}
                        className="input-field"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PLACED">Placed</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="DO_NOT_CONTACT">Do Not Contact</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Source</label>
                      <input
                        type="text"
                        value={editCandidateForm.source}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, source: e.target.value }))}
                        className="input-field"
                        placeholder="LinkedIn, Referral, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Current Resumes */}
                {selectedCandidate.resumes && selectedCandidate.resumes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Current Resumes</h4>
                    <div className="space-y-3">
                      {selectedCandidate.resumes.map((resume, index) => (
                        <div key={resume.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="font-medium">{resume.title}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(resume.experienceLevel)}`}>
                                  {getExperienceLabel(resume.experienceLevel)}
                                </span>
                                {resume.isPrimary && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(resume.url, '_blank')}
                              className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={resume.url}
                              download={resume.originalName}
                              className="btn btn-ghost btn-sm text-green-600 hover:text-green-700"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Skills</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNewSkill}
                        onChange={(e) => setEditNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(true))}
                        className="input-field flex-1"
                        placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(true)}
                        className="btn btn-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {editCandidateForm.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editCandidateForm.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill, true)}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add New Resumes */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Add New Resumes (Optional)</h4>
                  
                  {editSelectedResumes.length === 0 ? (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload additional resumes</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, TXT (max 5MB each)</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editSelectedResumes.map((resume, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">{resume.file.name}</span>
                              <span className="text-sm text-gray-500">
                                ({formatFileSize(resume.file.size)})
                              </span>
                            </div>
                            {!isUploadingResumes && (
                              <button
                                type="button"
                                onClick={() => removeSelectedResume(index, true)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="form-label">Resume Title</label>
                              <input
                                type="text"
                                value={resume.title}
                                onChange={(e) => updateResumeData(index, 'title', e.target.value, true)}
                                className="input-field"
                                placeholder="e.g., Senior Developer Resume"
                                disabled={isUploadingResumes}
                              />
                            </div>
                            <div>
                              <label className="form-label">Experience Level</label>
                              <select
                                value={resume.experienceLevel}
                                onChange={(e) => updateResumeData(index, 'experienceLevel', e.target.value, true)}
                                className="input-field"
                                disabled={isUploadingResumes}
                              >
                                {experienceLevels.map(level => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="form-label">Description (Optional)</label>
                            <textarea
                              value={resume.description}
                              onChange={(e) => updateResumeData(index, 'description', e.target.value, true)}
                              className="input-field"
                              rows={2}
                              placeholder="Brief description of this resume"
                              disabled={isUploadingResumes}
                            />
                          </div>

                          {/* Upload Progress */}
                          {uploadProgress[resume.file.name] && (
                            <div className="mt-3">
                              {uploadProgress[resume.file.name].status === 'uploading' && (
                                <div className="flex items-center gap-2">
                                  <div className="loading-spinner w-4 h-4" />
                                  <span className="text-sm text-blue-600">
                                    Uploading... {uploadProgress[resume.file.name].progress}%
                                  </span>
                                </div>
                              )}
                              {uploadProgress[resume.file.name].status === 'success' && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Uploaded successfully</span>
                                </div>
                              )}
                              {uploadProgress[resume.file.name].status === 'error' && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">{uploadProgress[resume.file.name].error}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {!isUploadingResumes && (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add More Resumes
                        </button>
                      )}
                    </div>
                  )}
                  
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept={Object.values(acceptedTypes).join(',')}
                    onChange={(e) => handleFileSelect(e.target.files, true)}
                    className="sr-only"
                    multiple
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea
                        value={editCandidateForm.bio}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="input-field"
                        rows={3}
                        placeholder="Brief description of the candidate's background and expertise..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea
                        value={editCandidateForm.notes}
                        onChange={(e) => setEditCandidateForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="input-field"
                        rows={2}
                        placeholder="Internal notes about the candidate..."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false)
                      resetEditForm()
                    }}
                    className="btn btn-secondary flex-1"
                    disabled={isUploadingResumes}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1"
                    disabled={isUploadingResumes}
                  >
                    {isUploadingResumes ? (
                      <div className="flex items-center gap-2">
                        <div className="loading-spinner w-4 h-4" />
                        Updating Candidate...
                      </div>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        Update Candidate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply to Jobs Modal */}
      <AnimatePresence>
        {showApplicationModal && selectedCandidate && (
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
              className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">Apply {selectedCandidate.name} to Jobs</h3>
                  <p className="text-gray-600">{selectedCandidate.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setApplicationForm({ selectedJobs: [], coverLetter: '', resumeUsed: '' })
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplyToJobs} className="space-y-6">
                <div className="form-group">
                  <label className="form-label required">Select Jobs</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                    {jobs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No active jobs available</p>
                    ) : (
                      jobs.map(job => (
                        <label key={job.id} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applicationForm.selectedJobs.includes(job.id)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setApplicationForm(prev => ({
                                ...prev,
                                selectedJobs: checked
                                  ? [...prev.selectedJobs, job.id]
                                  : prev.selectedJobs.filter(id => id !== job.id)
                              }))
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                            <p className="text-sm text-green-600">{job.salary}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {applicationForm.selectedJobs.length} job(s) selected
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Cover Letter</label>
                  <textarea
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="Optional cover letter or notes for the application..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Resume Used</label>
                  <select
                    value={applicationForm.resumeUsed}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, resumeUsed: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select resume (optional)</option>
                    {selectedCandidate.resumes?.map(resume => (
                      <option key={resume.id} value={resume.title}>
                        {resume.title} ({resume.experienceLevel?.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationModal(false)
                      setApplicationForm({ selectedJobs: [], coverLetter: '', resumeUsed: '' })
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={applicationForm.selectedJobs.length === 0}
                    className="btn btn-primary flex-1"
                  >
                    <Send className="w-4 h-4" />
                    Apply to {applicationForm.selectedJobs.length} Job(s)
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Management Modal */}
      <AnimatePresence>
        {showInterviewModal && selectedCandidate && (
          <InterviewManagement
            candidateId={selectedCandidate.id}
            candidateName={selectedCandidate.name}
            onClose={() => {
              setShowInterviewModal(false)
              setSelectedCandidate(null)
              fetchCandidates() // Refresh to show updated interview data
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CandidateManagement