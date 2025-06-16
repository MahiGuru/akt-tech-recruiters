// app/(client)/components/AdminDashboard.js (Enhanced with Full Management)
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Eye,
  Edit,
  MapPin,
  Briefcase,
  Star,
  Filter,
  Search,
  Download,
  RefreshCw,
  FileText,
  Video,
  Mail,
  Phone,
  Settings,
  MoreVertical,
  Link as LinkIcon,
  Unlink,
  Upload,
  Trash2,
  ChevronsRightLeftIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    teamStats: {},
    allCandidates: [],
    teamMembers: [],
    recentActivity: [],
    performanceMetrics: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecruiter, setSelectedRecruiter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAdminDashboardData()
  }, [])

  const fetchAdminDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all data needed for admin dashboard
      const [teamResponse, candidatesResponse, performanceResponse] = await Promise.all([
        fetch('/api/recruiter/team'),
        fetch('/api/recruiter/admin/candidates'),
        fetch('/api/recruiter/admin/performance')
      ])

      let teamData = { teamMembers: [], stats: {} }
      let candidatesData = { candidates: [], stats: {} }
      let performanceData = { metrics: {}, activity: [] }

      if (teamResponse.ok) {
        teamData = await teamResponse.json()
      }
      
      if (candidatesResponse.ok) {
        candidatesData = await candidatesResponse.json()
      }
      
      if (performanceResponse.ok) {
        performanceData = await performanceResponse.json()
      }

      setDashboardData({
        teamStats: teamData.stats,
        allCandidates: candidatesData.candidates || [],
        teamMembers: teamData.teamMembers || [],
        recentActivity: performanceData.activity || [],
        performanceMetrics: performanceData.metrics || {}
      })
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCandidateDetails = async (candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`)
      if (response.ok) {
        const candidate = await response.json()
        setCandidateDetails(candidate)
      } else {
        toast.error('Failed to load candidate details')
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to load candidate details')
    }
  }

  const handleViewCandidate = async (candidate) => {
    setSelectedCandidate(candidate)
    setShowCandidateModal(true)
    await fetchCandidateDetails(candidate.id)
  }

  const handleUpdateCandidateStatus = async (candidateId, newStatus) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      })

      if (response.ok) {
        toast.success('Candidate status updated successfully')
        await fetchAdminDashboardData()
        if (candidateDetails && candidateDetails.id === candidateId) {
          await fetchCandidateDetails(candidateId)
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update candidate status')
      }
    } catch (error) {
      console.error('Error updating candidate status:', error)
      toast.error('Failed to update candidate status')
    }
  }

  const handleScheduleInterview = async (candidateId, interviewData) => {
    try {
      const response = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          ...interviewData
        })
      })

      if (response.ok) {
        toast.success('Interview scheduled successfully')
        await fetchCandidateDetails(candidateId)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to schedule interview')
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      toast.error('Failed to schedule interview')
    }
  }

  const handleMapResume = async (resumeId, candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/resumes/${resumeId}/map`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (response.ok) {
        toast.success('Resume mapped successfully')
        await fetchCandidateDetails(candidateId)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to map resume')
      }
    } catch (error) {
      console.error('Error mapping resume:', error)
      toast.error('Failed to map resume')
    }
  }

  const filteredCandidates = dashboardData.allCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRecruiter = selectedRecruiter === 'all' || candidate.addedById === selectedRecruiter
    const matchesFilter = selectedFilter === 'all' || candidate.status === selectedFilter

    return matchesSearch && matchesRecruiter && matchesFilter
  })

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PLACED': 'bg-blue-100 text-blue-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'DO_NOT_CONTACT': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const CandidateModal = () => {
    if (!showCandidateModal || !selectedCandidate) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCandidateModal(false)
            setSelectedCandidate(null)
            setCandidateDetails(null)
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
                  <p className="text-blue-100">{selectedCandidate.email}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(selectedCandidate.status)}`}>
                    {selectedCandidate.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCandidateModal(false)
                  setSelectedCandidate(null)
                  setCandidateDetails(null)
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <ChevronsRightLeftIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Modal Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'resumes', label: 'Resumes', icon: FileText },
                { id: 'interviews', label: 'Interviews', icon: Video },
                { id: 'applications', label: 'Applications', icon: Briefcase },
                { id: 'actions', label: 'Actions', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Modal Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {candidateDetails ? (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{candidateDetails.email}</span>
                          </div>
                          {candidateDetails.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{candidateDetails.phone}</span>
                            </div>
                          )}
                          {candidateDetails.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{candidateDetails.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Professional Details</h3>
                        <div className="space-y-2">
                          {candidateDetails.experience && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span>{candidateDetails.experience} years experience</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>Added by {candidateDetails.addedBy?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {candidateDetails.skills && candidateDetails.skills.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {candidateDetails.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {candidateDetails.bio && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Bio</h3>
                        <p className="text-gray-600">{candidateDetails.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resumes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Resumes ({candidateDetails.resumes?.length || 0})</h3>
                      <button className="btn btn-sm btn-primary">
                        <Upload className="w-4 h-4" />
                        Upload Resume
                      </button>
                    </div>
                    
                    {candidateDetails.resumes && candidateDetails.resumes.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {candidateDetails.resumes.map((resume, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{resume.title || resume.originalName}</h4>
                                  <p className="text-sm text-gray-600">{resume.experienceLevel} • {new Date(resume.createdAt).toLocaleDateString()}</p>
                                </div>
                                {resume.isPrimary && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Primary</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => window.open(resume.url, '_blank')}
                                  className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No resumes uploaded yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'interviews' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Interviews ({candidateDetails.interviews?.length || 0})</h3>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          // Open interview scheduling modal
                          const scheduledAt = prompt('Enter interview date and time (YYYY-MM-DD HH:MM):')
                          const title = prompt('Enter interview title:')
                          if (scheduledAt && title) {
                            handleScheduleInterview(candidateDetails.id, {
                              title,
                              scheduledAt: new Date(scheduledAt).toISOString(),
                              duration: 60
                            })
                          }
                        }}
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Interview
                      </button>
                    </div>
                    
                    {candidateDetails.interviews && candidateDetails.interviews.length > 0 ? (
                      <div className="space-y-4">
                        {candidateDetails.interviews.map((interview, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{interview.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(interview.scheduledAt).toLocaleString()} • 
                                  Scheduled by {interview.scheduledBy?.name}
                                </p>
                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                                  interview.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                  interview.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                  interview.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {interview.status}
                                </span>
                              </div>
                              <button className="btn btn-ghost btn-sm">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No interviews scheduled yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'applications' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Job Applications ({candidateDetails.applications?.length || 0})</h3>
                    
                    {candidateDetails.applications && candidateDetails.applications.length > 0 ? (
                      <div className="space-y-4">
                        {candidateDetails.applications.map((application, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{application.job?.title}</h4>
                                <p className="text-sm text-gray-600">{application.job?.company}</p>
                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                                  application.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                  application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                  application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {application.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(application.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No applications submitted yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Admin Actions</h3>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['ACTIVE', 'PLACED', 'INACTIVE', 'DO_NOT_CONTACT'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleUpdateCandidateStatus(candidateDetails.id, status)}
                              className={`btn btn-sm ${
                                candidateDetails.status === status 
                                  ? 'btn-primary' 
                                  : 'btn-secondary'
                              }`}
                            >
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <button className="btn btn-secondary w-full">
                            <Edit className="w-4 h-4" />
                            Edit Candidate Details
                          </button>
                          <button className="btn btn-secondary w-full">
                            <LinkIcon className="w-4 h-4" />
                            Map Resume
                          </button>
                          <button className="btn btn-secondary w-full">
                            <Mail className="w-4 h-4" />
                            Send Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Complete overview and management of your recruiting team</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAdminDashboardData}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Team Members</p>
              <p className="text-3xl font-bold mt-1">{dashboardData.teamStats.total || 0}</p>
              <p className="text-blue-100 text-sm mt-1">
                {dashboardData.teamStats.active || 0} active
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
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Candidates</p>
              <p className="text-3xl font-bold mt-1">{dashboardData.allCandidates.length}</p>
              <p className="text-green-100 text-sm mt-1">
                {dashboardData.allCandidates.filter(c => c.status === 'ACTIVE').length} active
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
              <Target className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Placed Candidates</p>
              <p className="text-3xl font-bold mt-1">
                {dashboardData.allCandidates.filter(c => c.status === 'PLACED').length}
              </p>
              <p className="text-purple-100 text-sm mt-1">This month</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
              <Award className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Team Performance</p>
              <p className="text-3xl font-bold mt-1">87%</p>
              <p className="text-orange-100 text-sm mt-1">Success rate</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-lg p-3">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced All Candidates Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Team Candidates</h3>
            <div className="text-sm text-gray-600">
              {filteredCandidates.length} of {dashboardData.allCandidates.length} candidates
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={selectedRecruiter}
              onChange={(e) => setSelectedRecruiter(e.target.value)}
              className="input-field min-w-48"
            >
              <option value="all">All Recruiters</option>
              {dashboardData.teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PLACED">Placed</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DO_NOT_CONTACT">Do Not Contact</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedFilter !== 'all' || selectedRecruiter !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : 'Your team hasn\'t added any candidates yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewCandidate(candidate)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                          {candidate.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{candidate.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Added by {candidate.addedBy?.name}</span>
                        </div>
                        {candidate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{candidate.location}</span>
                          </div>
                        )}
                        {candidate.experience && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{candidate.experience} years experience</span>
                          </div>
                        )}
                      </div>

                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 ml-4">
                      <button 
                        className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCandidate(candidate)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">
                          {candidate.resumes?.length || 0} resumes
                        </div>
                        <div className="text-xs text-gray-500">
                          {candidate.interviews?.length || 0} interviews
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Candidate Detail Modal */}
      <CandidateModal />
    </div>
  )
}

export default AdminDashboard