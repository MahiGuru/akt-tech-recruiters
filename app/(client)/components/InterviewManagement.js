'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  Bell,
  Users,
  Timer
} from 'lucide-react'
import toast from 'react-hot-toast'

const InterviewManagement = ({ candidateId, candidateName, onClose }) => {
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingInterview, setEditingInterview] = useState(null)
  const [stats, setStats] = useState({})

  // Form state
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    meetingLink: '',
    notes: ''
  })

  useEffect(() => {
    if (candidateId) {
      fetchInterviews()
    }
  }, [candidateId])

  const fetchInterviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/recruiter/interviews?candidateId=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setInterviews(data.interviews)
        setStats(data.stats)
      } else {
        toast.error('Failed to load interviews')
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
      toast.error('Failed to load interviews')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    
    if (!interviewForm.title || !interviewForm.scheduledAt) {
      toast.error('Title and scheduled time are required')
      return
    }

    try {
      const response = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          ...interviewForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Interview scheduled successfully!')
        setInterviews([data.interview, ...interviews])
        resetForm()
        setShowScheduleForm(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to schedule interview')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleUpdateInterview = async (e) => {
    e.preventDefault()
    
    if (!editingInterview) return

    try {
      const response = await fetch('/api/recruiter/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: editingInterview.id,
          ...interviewForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Interview updated successfully!')
        setInterviews(interviews.map(interview => 
          interview.id === editingInterview.id ? data.interview : interview
        ))
        resetForm()
        setEditingInterview(null)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update interview')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDeleteInterview = async (interviewId, interviewTitle) => {
    if (!confirm(`Are you sure you want to cancel "${interviewTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recruiter/interviews?interviewId=${interviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Interview cancelled successfully')
        setInterviews(interviews.filter(interview => interview.id !== interviewId))
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to cancel interview')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleEditInterview = (interview) => {
    setEditingInterview(interview)
    setInterviewForm({
      title: interview.title,
      description: interview.description || '',
      scheduledAt: new Date(interview.scheduledAt).toISOString().slice(0, 16),
      duration: interview.duration,
      meetingLink: interview.meetingLink || '',
      notes: interview.notes || ''
    })
    setShowScheduleForm(true)
  }

  const resetForm = () => {
    setInterviewForm({
      title: '',
      description: '',
      scheduledAt: '',
      duration: 60,
      meetingLink: '',
      notes: ''
    })
    setEditingInterview(null)
  }

  const getStatusColor = (status) => {
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

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const isInterviewPast = (scheduledAt) => {
    return new Date(scheduledAt) < new Date()
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interview Management</h2>
              <p className="text-blue-100">Managing interviews for {candidateName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.total || 0}</div>
                  <div className="text-sm text-blue-600">Total Interviews</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.upcoming || 0}</div>
                  <div className="text-sm text-green-600">Upcoming</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {stats.statusDistribution?.find(s => s.status === 'COMPLETED')?.count || 0}
                  </div>
                  <div className="text-sm text-purple-600">Completed</div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">
                    {interviews.filter(i => 
                      new Date(i.scheduledAt) > new Date() && 
                      new Date(i.scheduledAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                  <div className="text-sm text-orange-600">Next 24h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Interview Schedule
            </h3>
            <button
              onClick={() => {
                resetForm()
                setShowScheduleForm(true)
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Schedule Interview
            </button>
          </div>

          {/* Schedule/Edit Form */}
          <AnimatePresence>
            {showScheduleForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6"
              >
                <h4 className="font-semibold text-blue-900 mb-4">
                  {editingInterview ? 'Edit Interview' : 'Schedule New Interview'}
                </h4>
                
                <form onSubmit={editingInterview ? handleUpdateInterview : handleScheduleInterview}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                      <label className="form-label required">Interview Title</label>
                      <input
                        type="text"
                        value={interviewForm.title}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field"
                        placeholder="e.g., Technical Interview, HR Round"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label required">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={interviewForm.scheduledAt}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        className="input-field"
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Duration (minutes)</label>
                      <select
                        value={interviewForm.duration}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="input-field"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Meeting Link</label>
                      <input
                        type="url"
                        value={interviewForm.meetingLink}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                        className="input-field"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                      value={interviewForm.description}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, description: e.target.value }))}
                      className="input-field"
                      rows={3}
                      placeholder="Interview details, topics to cover, etc."
                    />
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label">Notes</label>
                    <textarea
                      value={interviewForm.notes}
                      onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="input-field"
                      rows={2}
                      placeholder="Internal notes about the interview"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowScheduleForm(false)
                        resetForm()
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interviews List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="loading-spinner w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading interviews...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
              <p className="text-gray-600 mb-4">Schedule your first interview with this candidate</p>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Schedule Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview, index) => {
                const { date, time } = formatDateTime(interview.scheduledAt)
                const timeUntil = getTimeUntilInterview(interview.scheduledAt)
                const isPast = isInterviewPast(interview.scheduledAt)
                
                return (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`border rounded-lg p-6 ${
                      isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-md'
                    } transition-shadow`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{interview.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(interview.status)}`}>
                            {interview.status.replace('_', ' ')}
                          </span>
                          {!isPast && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              <Timer className="w-3 h-3 inline mr-1" />
                              {timeUntil}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{time} ({interview.duration} min)</span>
                          </div>
                          {interview.meetingLink && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Video className="w-4 h-4" />
                              <a 
                                href={interview.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {interview.description && (
                          <p className="text-gray-700 mb-3">{interview.description}</p>
                        )}
                        
                        {interview.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-yellow-800">
                              <strong>Notes:</strong> {interview.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!isPast && (
                          <button
                            onClick={() => handleEditInterview(interview)}
                            className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                            title="Edit interview"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInterview(interview.id, interview.title)}
                          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                          title="Cancel interview"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default InterviewManagement