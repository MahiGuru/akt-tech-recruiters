// app/(client)/components/AdminPasswordManagement.jsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Shield, 
  Clock, 
  Users, 
  AlertTriangle,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Mail,
  Key,
  Activity,
  TrendingUp
} from 'lucide-react'

export default function AdminPasswordManagement() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithPasswords: 0,
    activeResetTokens: 0,
    expiredTokens: 0,
    recentResets: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [resetTokens, setResetTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTokens, setShowTokens] = useState(false)

  useEffect(() => {
    fetchPasswordStats()
    fetchRecentActivity()
  }, [])

  const fetchPasswordStats = async () => {
    try {
      const response = await fetch('/api/admin/password-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setResetTokens(data.tokens || [])
      }
    } catch (error) {
      console.error('Error fetching password stats:', error)
      toast.error('Failed to load password statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/password-activity')
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.activity || [])
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const cleanupExpiredTokens = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/forgot-password', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Cleaned up ${result.cleaned} expired tokens`)
        fetchPasswordStats()
      } else {
        toast.error('Failed to cleanup tokens')
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      toast.error('Cleanup failed')
    } finally {
      setLoading(false)
    }
  }

  const revokeToken = async (tokenId) => {
    try {
      const response = await fetch('/api/admin/revoke-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      })
      
      if (response.ok) {
        toast.success('Token revoked successfully')
        fetchPasswordStats()
      } else {
        toast.error('Failed to revoke token')
      }
    } catch (error) {
      console.error('Revoke error:', error)
      toast.error('Failed to revoke token')
    }
  }

  const sendBulkPasswordReset = async () => {
    try {
      const response = await fetch('/api/admin/bulk-password-reset', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Password reset emails sent to ${result.sent} users`)
      } else {
        toast.error('Failed to send bulk password reset')
      }
    } catch (error) {
      console.error('Bulk reset error:', error)
      toast.error('Bulk password reset failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Password Management</h2>
          <p className="text-gray-600 mt-1">Monitor and manage user password security</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPasswordStats}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={cleanupExpiredTokens}
            className="btn btn-primary"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Expired
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: "Total Users",
            value: stats.totalUsers,
            subtitle: "Registered accounts",
            icon: Users,
            color: "blue"
          },
          {
            title: "Password Users",
            value: stats.usersWithPasswords,
            subtitle: `${Math.round((stats.usersWithPasswords / stats.totalUsers) * 100)}% of total`,
            icon: Key,
            color: "green"
          },
          {
            title: "Active Reset Tokens",
            value: stats.activeResetTokens,
            subtitle: "Pending resets",
            icon: Clock,
            color: "yellow"
          },
          {
            title: "Expired Tokens",
            value: stats.expiredTokens,
            subtitle: "Need cleanup",
            icon: AlertTriangle,
            color: "red"
          },
          {
            title: "Recent Resets",
            value: stats.recentResets,
            subtitle: "Last 24 hours",
            icon: TrendingUp,
            color: "purple"
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-${stat.color}-600 text-sm mt-1`}>{stat.subtitle}</p>
              </div>
              <div className={`bg-${stat.color}-100 rounded-lg p-3`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Reset Tokens */}
      {resetTokens.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Reset Tokens</h3>
            <button
              onClick={() => setShowTokens(!showTokens)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showTokens ? 'Hide' : 'Show'} Tokens
            </button>
          </div>

          <div className="space-y-3">
            {resetTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{token.user?.email}</p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(token.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(token.expires).toLocaleString()}
                      </p>
                      {showTokens && (
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          Token: {token.token.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    new Date(token.expires) > new Date()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {new Date(token.expires) > new Date() ? 'Valid' : 'Expired'}
                  </span>
                  
                  <button
                    onClick={() => revokeToken(token.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Revoke token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Password Activity</h3>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent password activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'reset' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.type === 'reset' ? (
                      <RefreshCw className={`w-4 h-4 ${
                        activity.type === 'reset' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    ) : (
                      <Shield className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">{activity.userEmail}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Admin Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Administrative Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={cleanupExpiredTokens}
            className="btn btn-secondary justify-start"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
            Clean Up Expired Tokens
          </button>
          
          <button
            onClick={sendBulkPasswordReset}
            className="btn btn-outline justify-start"
          >
            <Mail className="w-4 h-4" />
            Bulk Password Reset Email
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p>Regularly monitor password reset activity and clean up expired tokens. Consider implementing additional security measures like 2FA for sensitive accounts.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}