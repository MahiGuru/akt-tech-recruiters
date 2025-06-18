// app/(client)/components/AdminCandidateOverview.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  Award,
  Mail,
  Phone,
  FileText,
  Video,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Send,
  MoreVertical,
  TrendingUp,
  Activity,
  RefreshCw,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminCandidateOverview = () => {
  const [candidates, setCandidates] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [stats, setStats] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [recruiterFilter, setRecruiterFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchAdminCandidates()
  }, [])

  const fetchAdminCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recruiter/admin/candidates')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        setStats(data.stats || {})
        
        // Extract unique recruiters from candidates
        const recruiters = [...new Map(
          data.candidates
            .filter(c => c.addedBy)
            .map(c => [c.addedBy.id, c.addedBy])
        ).values()]
        setTeamMembers(recruiters)
      } else {
        toast.error('Failed to load candidates')
      }
    } catch (error) {
      console.error('Error fetching admin candidates:', error)
      toast.error('Failed to load candidates')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
      'PLACED': 'bg-blue-100 text-blue-800 border-blue-200',
      'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-200',
      'DO_NOT_CONTACT': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getRecruiterTypeColor = (type) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'LEAD': 'bg-purple-100 text-purple-800',
      'TA': 'bg-blue-100 text-blue-800',
      'HR': 'bg-green-100 text-green-800',
      'CS': 'bg-indigo-100 text-indigo-800',
      'JUNIOR': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = !statusFilter || candidate.status === statusFilter
    const matchesRecruiter = !recruiterFilter || candidate.addedById === recruiterFilter

    return matchesSearch && matchesStatus && matchesRecruiter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loading-spinner w-8 h-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Loading candidate data...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Team Candidates</h2>
          <p className="text-gray-600">Overview of candidates managed by your recruiting team</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAdminCandidates}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Candidates</p>
              <p className="text-3xl font-bold mt-1">{stats.total || 0}</p>
              <p className="text-blue-100 text-sm mt-1">
                Across {teamMembers.length} recruiters
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Candidates</p>
              <p className="text-3xl font-bold mt-1">{stats.active || 0}</p>
              <p className="text-green-100 text-sm mt-1">
                Ready for opportunities
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Placed</p>
              <p className="text-3xl font-bold mt-1">{stats.placed || 0}</p>
              <p className="text-purple-100 text-sm mt-1">
                {stats.placementRate || 0}% success rate
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
              <Target className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">With Resumes</p>
              <p className="text-3xl font-bold mt-1">{stats.withResumes || 0}</p>
              <p className="text-orange-100 text-sm mt-1">
                {stats.withApplications || 0} with applications
              </p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-lg p-3">
              <FileText className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          
          <select
            value={recruiterFilter}
            onChange={(e) => setRecruiterFilter(e.target.value)}
            className="input-field min-w-48"
          >
            <option value="">All Recruiters</option>
            {teamMembers.map(recruiter => (
              <option key={recruiter.id} value={recruiter.id}>
                {recruiter.name} ({recruiter.recruiterProfile?.recruiterType || 'N/A'})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PLACED">Placed</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Candidates ({filteredCandidates.length})
            </h3>
            <div className="text-sm text-gray-600">
              {filteredCandidates.length} of {candidates.length} candidates
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter || recruiterFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'Your team hasn\'t added any candidates yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate, index) => {
                const upcomingInterviews = getUpcomingInterviews(candidate)
                const hasUpcomingInterview = upcomingInterviews.length > 0
                const nextInterview = upcomingInterviews[0]

                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 border rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      hasUpcomingInterview 
                        ? 'border-blue-300 bg-blue-50 hover:border-blue-400' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedCandidate(candidate)
                      setShowDetailModal(true)
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button className="btn btn-ghost btn-sm p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status & Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                        {candidate.status.replace('_', ' ')}
                      </span>
                      {hasUpcomingInterview && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Interview Scheduled
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecruiterTypeColor(candidate.addedBy?.recruiterProfile?.recruiterType)}`}>
                        Added by {candidate.addedBy?.name}
                      </span>
                    </div>

                    {/* Interview Info */}
                    {hasUpcomingInterview && (
                      <div className="mb-4 p-3 bg-white border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900 text-sm">{nextInterview.title}</span>
                          </div>
                          <span className={`text-xs font-medium ${formatInterviewDateTime(nextInterview.scheduledAt).urgent ? 'text-red-600' : 'text-blue-600'}`}>
                            {formatInterviewDateTime(nextInterview.scheduledAt).text}
                          </span>
                        </div>
                        {upcomingInterviews.length > 1 && (
                          <p className="text-xs text-blue-600 mt-1">
                            +{upcomingInterviews.length - 1} more interview(s)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {candidate.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{candidate.location}</span>
                        </div>
                      )}
                      {candidate.experience && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{candidate.experience} years experience</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Added {new Date(candidate.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{candidate.resumes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          <span>{candidate.applications?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          <span>{candidate.interviews?.length || 0}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCandidate(candidate)
                          setShowDetailModal(true)
                        }}
                        className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false)
                setSelectedCandidate(null)
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {selectedCandidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                      <p className="text-gray-600">{selectedCandidate.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedCandidate.status)}`}>
                          {selectedCandidate.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          Added by {selectedCandidate.addedBy?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedCandidate(null)
                    }}
                    className="btn btn-ghost btn-sm p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Detailed content would go here */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Basic Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{selectedCandidate.email}</span>
                        </div>
                        {selectedCandidate.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{selectedCandidate.phone}</span>
                          </div>
                        )}
                        {selectedCandidate.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{selectedCandidate.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCandidate.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Activity & Stats */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedCandidate.resumes?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Resumes</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedCandidate.applications?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Applications</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedCandidate.interviews?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Interviews</div>
                      </div>
                    </div>

                    {selectedCandidate.bio && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Bio</h3>
                        <p className="text-gray-700">{selectedCandidate.bio}</p>
                      </div>
                    )}

                    {selectedCandidate.notes && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Recruiter Notes</h3>
                        <p className="text-gray-700">{selectedCandidate.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminCandidateOverview