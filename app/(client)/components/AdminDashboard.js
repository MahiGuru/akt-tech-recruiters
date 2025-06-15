// app/(client)/components/AdminDashboard.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  User,
  Shield,
  UserCheck,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [pendingRequests, setPendingRequests] = useState([])
  const [stats, setStats] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch pending requests
      const pendingResponse = await fetch('/api/recruiter/team/pending')
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingRequests(pendingData.requests || [])
      }

      // Fetch team stats
      const teamResponse = await fetch('/api/recruiter/team')
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setStats(teamData.stats || {})
      }

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalAction = async (requestId, action, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/team/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action
        })
      })

      if (response.ok) {
        toast.success(`${candidateName}'s request ${action}d successfully`)
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error('Something went wrong')
    }
  }

  const getRecruiterTypeConfig = (type) => {
    const configs = {
      'TA': { label: 'Technical Analyst', color: 'bg-blue-100 text-blue-800', icon: '🔍' },
      'HR': { label: 'Human Resources', color: 'bg-green-100 text-green-800', icon: '👥' },
      'CS': { label: 'Customer Success', color: 'bg-purple-100 text-purple-800', icon: '🤝' },
      'LEAD': { label: 'Lead Recruiter', color: 'bg-orange-100 text-orange-800', icon: '🎯' },
      'JUNIOR': { label: 'Junior Recruiter', color: 'bg-gray-100 text-gray-800', icon: '⭐' }
    }
    return configs[type] || configs['TA']
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Overview Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-red-100">Manage team members and approvals</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total Team</span>
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-2xl font-bold">{stats.active || 0}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold">{pendingRequests.length}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Growth</span>
            </div>
            <p className="text-2xl font-bold">↑12%</p>
          </div>
        </div>
      </div>

      {/* Urgent: Pending Approvals */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg border border-yellow-200 shadow-sm">
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">
                  Urgent: Pending Approvals ({pendingRequests.length})
                </h3>
                <p className="text-yellow-700 text-sm">
                  New recruiters are waiting for your approval to access the system
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {pendingRequests.map((request, index) => {
              const typeConfig = getRecruiterTypeConfig(request.recruiterType)
              
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      {request.user?.image ? (
                        <img 
                          src={request.user.image} 
                          alt={request.user.name} 
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{request.user?.name}</h4>
                      <p className="text-sm text-gray-600">{request.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.icon} {typeConfig.label}
                        </span>
                        {request.department && (
                          <span className="text-xs text-gray-500">• {request.department}</span>
                        )}
                        <span className="text-xs text-gray-500">
                          • {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovalAction(request.id, 'approve', request.user?.name)}
                      className="btn btn-sm bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprovalAction(request.id, 'reject', request.user?.name)}
                      className="btn btn-sm bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Team Overview</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Monitor your team performance and growth
          </p>
          <div className="space-y-2">
            {stats.typeDistribution?.map((type, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{type.type}s:</span>
                <span className="font-medium">{type.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Growth Metrics</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Track team expansion and productivity
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">This Month:</span>
              <span className="font-medium text-green-600">+3 members</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Rate:</span>
              <span className="font-medium">
                {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Latest team member activities
          </p>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">No recent activity</span>
            </div>
          </div>
        </div>
      </div>

      {/* No Pending Requests Message */}
      {pendingRequests.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600">
            No pending approval requests at the moment. Your team is all set.
          </p>
        </div>
      )}
    </div>
  )
}