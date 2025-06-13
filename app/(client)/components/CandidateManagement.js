'use client'

import { useState, useEffect } from 'react'
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
  CalendarDays
} from 'lucide-react'
import toast from 'react-hot-toast'
import InterviewManagement from './InterviewManagement'

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [stats, setStats] = useState({})

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

  const [applicationForm, setApplicationForm] = useState({
    selectedJobs: [],
    coverLetter: '',
    resumeUsed: ''
  })

  const [newSkill, setNewSkill] = useState('')

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
  }

  const addSkill = () => {
    if (newSkill.trim() && !candidateForm.skills.includes(newSkill.trim())) {
      setCandidateForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setCandidateForm(prev => ({
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
              if (e.target === e.currentTarget) {
                setShowAddForm(false)
                resetForm()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="space-y-4">
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

                <div className="form-group">
                  <label className="form-label">Skills</label>
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    <Plus className="w-4 h-4" />
                    Add Candidate
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