// app/(client)/components/EnhancedTeamFeatures.js
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Activity,
  Download,
  Share2,
  Printer,
  Eye,
  Filter,
  Calendar,
  Clock,
  UserPlus,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Zap,
  Crown,
  Shield,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'

// Team Analytics Dashboard Component
export function TeamAnalytics({ teamHierarchy, timeRange = '30' }) {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/recruiter/team/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const teamMetrics = useMemo(() => {
    if (!analytics) return null

    return {
      totalCandidates: analytics.metrics?.totalCandidates || 0,
      totalPlacements: analytics.metrics?.totalPlaced || 0,
      avgPlacementRate: analytics.metrics?.averagePlacementRate || 0,
      topPerformer: analytics.metrics?.topPerformer,
      growthRate: analytics.trends?.growth || 0
    }
  }, [analytics])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Team Performance Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => fetchAnalytics(e.target.value)}
          className="input-field py-2 px-3"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Candidates</p>
                <p className="text-2xl font-bold">{teamMetrics.totalCandidates}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Placements</p>
                <p className="text-2xl font-bold">{teamMetrics.totalPlacements}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">{teamMetrics.avgPlacementRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Growth</p>
                <p className="text-2xl font-bold">+{teamMetrics.growthRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-200" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Performer Highlight */}
      {teamMetrics?.topPerformer && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Top Performer</h4>
              <p className="text-gray-600">
                {teamMetrics.topPerformer.recruiter?.name} - {teamMetrics.topPerformer.metrics?.placementRate}% success rate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {analytics?.trends && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h4>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would go here</p>
            {/* You can integrate Chart.js, Recharts, or similar here */}
          </div>
        </div>
      )}
    </div>
  )
}

// Org Chart Visualization Component
export function OrgChart({ teamHierarchy, onMemberClick }) {
  const [viewMode, setViewMode] = useState('tree') // 'tree' or 'grid'

  const renderOrgNode = (member, level = 0) => {
    const hasSubordinates = member.subordinates && member.subordinates.length > 0
    
    return (
      <div key={member.id} className="flex flex-col items-center">
        {/* Member Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={() => onMemberClick?.(member)}
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
            member.isMainAdmin ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          style={{ minWidth: '200px' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                member.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
              }`}>
                {member.user.image ? (
                  <img 
                    src={member.user.image} 
                    alt={member.user.name} 
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              {member.isMainAdmin && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{member.user.name}</h4>
              <p className="text-sm text-gray-600 truncate">{member.recruiterType}</p>
              {member.department && (
                <p className="text-xs text-gray-500">{member.department}</p>
              )}
            </div>
          </div>
          
          {hasSubordinates && (
            <div className="mt-2 text-xs text-blue-600 text-center">
              {member.subordinates.length} report{member.subordinates.length > 1 ? 's' : ''}
            </div>
          )}
        </motion.div>

        {/* Connection Lines and Subordinates */}
        {hasSubordinates && (
          <div className="flex flex-col items-center mt-4">
            {/* Vertical line down */}
            <div className="w-px h-6 bg-gray-300"></div>
            
            {/* Horizontal line across subordinates */}
            {member.subordinates.length > 1 && (
              <div className="relative">
                <div className="h-px bg-gray-300" style={{ width: `${(member.subordinates.length - 1) * 250}px` }}></div>
                {/* Vertical drops to each subordinate */}
                {member.subordinates.map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-px h-6 bg-gray-300"
                    style={{ left: `${index * 250}px`, top: '0' }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Subordinates */}
            <div className="flex gap-12 mt-6">
              {member.subordinates.map((subordinate) => (
                <div key={subordinate.id}>
                  {renderOrgNode(subordinate, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Organization Chart</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'tree' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {viewMode === 'tree' ? (
          <div className="min-w-max p-8">
            {teamHierarchy.map((rootMember) => (
              <div key={rootMember.id} className="flex justify-center">
                {renderOrgNode(rootMember)}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Flatten hierarchy for grid view */}
            {flattenHierarchy(teamHierarchy).map((member) => (
              <motion.div
                key={member.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onMemberClick?.(member)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      member.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
                    }`}>
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {member.isMainAdmin && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{member.user.name}</h4>
                    <p className="text-sm text-gray-600">{member.recruiterType}</p>
                  </div>
                </div>
                
                {member.department && (
                  <p className="text-xs text-gray-500 mb-2">📍 {member.department}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Level {member.level}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Team Directory Component
export function TeamDirectory({ teamHierarchy }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'cards'

  const flatMembers = useMemo(() => {
    return flattenHierarchy(teamHierarchy)
  }, [teamHierarchy])

  const filteredMembers = useMemo(() => {
    return flatMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = !filterRole || member.recruiterType === filterRole
      const matchesDepartment = !filterDepartment || member.department === filterDepartment

      return matchesSearch && matchesRole && matchesDepartment
    })
  }, [flatMembers, searchTerm, filterRole, filterDepartment])

  const uniqueDepartments = useMemo(() => {
    const departments = flatMembers
      .map(m => m.department)
      .filter(Boolean)
      .filter((dept, index, arr) => arr.indexOf(dept) === index)
    return departments
  }, [flatMembers])

  const exportDirectory = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Status', 'Level'].join(','),
      ...filteredMembers.map(member => [
        member.user.name,
        member.user.email,
        member.recruiterType,
        member.department || '',
        member.isActive ? 'Active' : 'Inactive',
        member.level
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'team-directory.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Directory exported successfully!')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Team Directory</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportDirectory}
            className="btn btn-secondary px-4 py-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
            className="btn btn-secondary px-4 py-2"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'list' ? 'Card View' : 'List View'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input-field"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="LEAD">Lead</option>
          <option value="TA">Technical Analyst</option>
          <option value="HR">HR</option>
          <option value="CS">Customer Success</option>
          <option value="JUNIOR">Junior</option>
        </select>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="input-field"
        >
          <option value="">All Departments</option>
          {uniqueDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <div className="text-sm text-gray-600 flex items-center">
          {filteredMembers.length} of {flatMembers.length} members
        </div>
      </div>

      {/* Members Display */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Member</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Level</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          member.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
                        }`}>
                          {member.user.image ? (
                            <img 
                              src={member.user.image} 
                              alt={member.user.name} 
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Users className="w-4 h-4 text-white" />
                          )}
                        </div>
                        {member.isMainAdmin && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Crown className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.recruiterType)}`}>
                      {member.recruiterType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{member.department || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">Level {member.level}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${member.user.email}`}
                        className="text-blue-600 hover:text-blue-700"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      {member.user.phone && (
                        <a
                          href={`tel:${member.user.phone}`}
                          className="text-green-600 hover:text-green-700"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
                  }`}>
                    {member.user.image ? (
                      <img 
                        src={member.user.image} 
                        alt={member.user.name} 
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-white" />
                    )}
                  </div>
                  {member.isMainAdmin && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{member.user.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.recruiterType)}`}>
                    {member.recruiterType}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {member.department && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {member.department}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">Level {member.level}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${member.user.email}`}
                      className="text-blue-600 hover:text-blue-700"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    {member.user.phone && (
                      <a
                        href={`tel:${member.user.phone}`}
                        className="text-green-600 hover:text-green-700"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No members found</h4>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}

// Utility functions
function flattenHierarchy(hierarchy) {
  let flat = []
  hierarchy.forEach(node => {
    flat.push(node)
    if (node.subordinates && node.subordinates.length > 0) {
      flat = flat.concat(flattenHierarchy(node.subordinates))
    }
  })
  return flat
}

function getRoleColor(role) {
  const colors = {
    ADMIN: 'bg-red-100 text-red-800',
    LEAD: 'bg-purple-100 text-purple-800',
    TA: 'bg-blue-100 text-blue-800',
    HR: 'bg-green-100 text-green-800',
    CS: 'bg-indigo-100 text-indigo-800',
    JUNIOR: 'bg-gray-100 text-gray-800'
  }
  return colors[role] || colors.JUNIOR
}