// app/(client)/components/AdminDashboard.js
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
  MapPin,
  Briefcase,
  Star,
  Filter,
  Search,
  Download,
  RefreshCw
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
          <p className="text-gray-600">Overview of your recruiting team's performance and candidates</p>
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

      {/* Team Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Members Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-secondary">
                <BarChart3 className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {dashboardData.teamMembers.map((member, index) => {
              const candidateCount = dashboardData.allCandidates.filter(c => c.addedById === member.userId).length
              const placedCount = dashboardData.allCandidates.filter(c => c.addedById === member.userId && c.status === 'PLACED').length
              
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                      <p className="text-sm text-gray-600">
                        {member.recruiterType} • {member.department || 'No Department'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{candidateCount}</p>
                      <p className="text-gray-600">Candidates</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{placedCount}</p>
                      <p className="text-gray-600">Placed</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-blue-600">
                        {candidateCount > 0 ? Math.round((placedCount / candidateCount) * 100) : 0}%
                      </p>
                      <p className="text-gray-600">Success</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {dashboardData.recentActivity.slice(0, 8).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.title || 'New candidate added'}</p>
                  <p className="text-xs text-gray-600">{activity.time || '2 minutes ago'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* All Candidates Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-sm border"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Team Candidates</h3>
            <div className="text-sm text-gray-600">
              {filteredCandidates.length} of {dashboardData.allCandidates.length} candidates
            </div>
          </div>

          {/* Filters */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                          {candidate.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
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
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard