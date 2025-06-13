'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  FileText, 
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building,
  UserCheck,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Star,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function RecruiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('resumes')
  const [resumes, setResumes] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({
    totalResumes: 0,
    newApplications: 0,
    teamSize: 0,
    unreadNotifications: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const user = session?.user
  const isAdmin = user?.recruiterProfile?.recruiterType === 'ADMIN'

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    if (session.user.role !== 'RECRUITER') {
      router.push('/dashboard/employee')
      return
    }
    
    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch resumes
      const resumesResponse = await fetch('/api/recruiter/resumes')
      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json()
        setResumes(resumesData)
      }

      // Fetch team members (if admin)
      if (isAdmin) {
        const teamResponse = await fetch('/api/recruiter/team')
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamMembers(teamData)
        }
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/recruiter/notifications')
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData)
      }

      // Calculate stats
      const resumeCount = resumes.length
      const unreadCount = notifications.filter(n => !n.isRead).length
      
      setStats({
        totalResumes: resumeCount,
        newApplications: 12, // This would come from applications API
        teamSize: teamMembers.length,
        unreadNotifications: unreadCount
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const sendNotificationToAdmin = async (message) => {
    try {
      const response = await fetch('/api/recruiter/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Request from Team Member',
          message,
          type: 'APPROVAL_REQUEST'
        })
      })

      if (response.ok) {
        toast.success('Notification sent to admin successfully!')
        setShowNotificationModal(false)
      } else {
        throw new Error('Failed to send notification')
      }
    } catch (error) {
      toast.error('Failed to send notification')
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesExperience = !experienceFilter || resume.experienceLevel === experienceFilter
    
    return matchesSearch && matchesExperience
  })

  const getRecruiterTypeColor = (type) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'TA': 'bg-blue-100 text-blue-800',
      'HR': 'bg-green-100 text-green-800',
      'CS': 'bg-purple-100 text-purple-800',
      'LEAD': 'bg-orange-100 text-orange-800',
      'JUNIOR': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getRecruiterTypeLabel = (type) => {
    const labels = {
      'ADMIN': 'Admin',
      'TA': 'Technical Analyst',
      'HR': 'Human Resources',
      'CS': 'Customer Success',
      'LEAD': 'Lead Recruiter',
      'JUNIOR': 'Junior Recruiter'
    }
    return labels[type] || type
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  if (!session || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">At Bench</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-6 h-6" />
                  {stats.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {stats.unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                {user.image && (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {getRecruiterTypeLabel(user.recruiterProfile?.recruiterType)}
                  </p>
                </div>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResumes}</p>
                <p className="text-gray-600">Total Resumes</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.newApplications}</p>
                <p className="text-gray-600">New Applications</p>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.teamSize}</p>
                  <p className="text-gray-600">Team Members</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">85%</p>
                <p className="text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('resumes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'resumes'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                All Resumes
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Team Management
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
                {stats.unreadNotifications > 0 && (
                  <span className="ml-1 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Resumes Tab */}
            {activeTab === 'resumes' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                  
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Experience Levels</option>
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR_LEVEL">Senior Level</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>

                {/* Resumes List */}
                <div className="space-y-4">
                  {filteredResumes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
                      <p className="text-gray-600">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    filteredResumes.map((resume, index) => (
                      <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-primary-600" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {resume.user.name}
                                </h3>
                                <p className="text-gray-600 mb-2">{resume.title}</p>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {resume.user.email}
                                  </div>
                                  {resume.user.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-4 h-4" />
                                      {resume.user.phone}
                                    </div>
                                  )}
                                  {resume.user.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {resume.user.location}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(resume.createdAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    resume.experienceLevel === 'ENTRY_LEVEL' ? 'bg-green-100 text-green-800' :
                                    resume.experienceLevel === 'MID_LEVEL' ? 'bg-blue-100 text-blue-800' :
                                    resume.experienceLevel === 'SENIOR_LEVEL' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {resume.experienceLevel.replace('_', ' ')}
                                  </span>
                                  {resume.isPrimary && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => window.open(resume.url, '_blank')}
                              className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                              title="View resume"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={resume.url}
                              download={resume.originalName}
                              className="btn btn-ghost btn-sm text-green-600 hover:text-green-700"
                              title="Download resume"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(resume.user.email)
                                toast.success('Email copied to clipboard!')
                              }}
                              className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                              title="Copy email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Team Management Tab (Admin Only) */}
            {activeTab === 'team' && isAdmin && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
                  <button className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Team Member
                  </button>
                </div>

                <div className="space-y-4">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                      <p className="text-gray-600">Start building your recruiting team</p>
                    </div>
                  ) : (
                    teamMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              {member.recruiterType === 'ADMIN' ? 
                                <Shield className="w-6 h-6 text-red-600" /> :
                                <UserCheck className="w-6 h-6 text-blue-600" />
                              }
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{member.user.name}</h3>
                              <p className="text-gray-600">{member.user.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecruiterTypeColor(member.recruiterType)}`}>
                                  {getRecruiterTypeLabel(member.recruiterType)}
                                </span>
                                {member.department && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {member.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button className="btn btn-ghost btn-sm">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost btn-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                  {!isAdmin && (
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="btn btn-primary"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send to Admin
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                      <p className="text-gray-600">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`border rounded-lg p-4 ${
                          notification.isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                            notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                            notification.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.type === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> :
                             notification.type === 'WARNING' ? <AlertCircle className="w-4 h-4" /> :
                             notification.type === 'ERROR' ? <AlertCircle className="w-4 h-4" /> :
                             <Bell className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Send Notification to Admin</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const message = e.target.message.value
              if (message.trim()) {
                sendNotificationToAdmin(message.trim())
              }
            }}>
              <textarea
                name="message"
                placeholder="Enter your message for the admin recruiter..."
                className="input-field w-full h-32 resize-none mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}