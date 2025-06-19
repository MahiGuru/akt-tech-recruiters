// app/(client)/components/SecurityMonitoringDashboard.jsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react'

export default function SecurityMonitoringDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState({
    totalLogins: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    passwordResets: 0,
    accountLockouts: 0,
    multipleDeviceLogins: 0
  })
  
  const [loginAttempts, setLoginAttempts] = useState([])
  const [securityEvents, setSecurityEvents] = useState([])
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    eventType: 'all',
    riskLevel: 'all',
    search: ''
  })

  useEffect(() => {
    fetchSecurityData()
  }, [timeRange])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [metricsRes, attemptsRes, eventsRes] = await Promise.all([
        fetch(`/api/admin/security-metrics?timeRange=${timeRange}`),
        fetch(`/api/admin/login-attempts?timeRange=${timeRange}`),
        fetch(`/api/admin/security-events?timeRange=${timeRange}`)
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setSecurityMetrics(data.metrics)
      }

      if (attemptsRes.ok) {
        const data = await attemptsRes.json()
        setLoginAttempts(data.attempts)
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setSecurityEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const exportSecurityReport = async () => {
    try {
      const response = await fetch(`/api/admin/security-report?timeRange=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Security report downloaded')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDeviceIcon = (device) => {
    if (device?.includes('Mobile')) return Smartphone
    if (device?.includes('Tablet')) return Smartphone
    return Monitor
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesType = filters.eventType === 'all' || event.type === filters.eventType
    const matchesRisk = filters.riskLevel === 'all' || event.riskLevel === filters.riskLevel
    const matchesSearch = !filters.search || 
      event.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.userEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.ipAddress?.includes(filters.search)
    
    return matchesType && matchesRisk && matchesSearch
  })

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
          <h2 className="text-2xl font-bold text-gray-900">Security Monitoring</h2>
          <p className="text-gray-600 mt-1">Monitor security events and user authentication activity</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={fetchSecurityData}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportSecurityReport}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {[
          {
            title: "Total Logins",
            value: securityMetrics.totalLogins,
            subtitle: "Successful authentications",
            icon: Users,
            color: "blue",
            trend: "+12%"
          },
          {
            title: "Failed Logins",
            value: securityMetrics.failedLogins,
            subtitle: "Authentication failures",
            icon: Lock,
            color: "red",
            trend: "-5%"
          },
          {
            title: "Suspicious Activity",
            value: securityMetrics.suspiciousActivity,
            subtitle: "Potential threats",
            icon: AlertTriangle,
            color: "yellow",
            trend: "+2%"
          },
          {
            title: "Password Resets",
            value: securityMetrics.passwordResets,
            subtitle: "Reset requests",
            icon: RefreshCw,
            color: "purple",
            trend: "-3%"
          },
          {
            title: "Account Lockouts",
            value: securityMetrics.accountLockouts,
            subtitle: "Locked accounts",
            icon: Shield,
            color: "orange",
            trend: "-8%"
          },
          {
            title: "Multi-Device Logins",
            value: securityMetrics.multipleDeviceLogins,
            subtitle: "Cross-device access",
            icon: Globe,
            color: "green",
            trend: "+15%"
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-${metric.color}-100 rounded-lg p-2`}>
                <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                metric.trend.startsWith('+') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {metric.trend}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Login Attempts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Login Attempts</h3>
        
        {loginAttempts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent login attempts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loginAttempts.slice(0, 10).map((attempt, index) => {
              const DeviceIcon = getDeviceIcon(attempt.userAgent)
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    attempt.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      attempt.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {attempt.success ? (
                        <Shield className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{attempt.userEmail}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{attempt.ipAddress}</span>
                        <span>{attempt.location}</span>
                        <div className="flex items-center gap-1">
                          <DeviceIcon className="w-4 h-4" />
                          <span>{attempt.device}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(attempt.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Security Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Security Events</h3>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10 text-sm w-64"
              />
            </div>
            
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="input-field text-sm"
            >
              <option value="all">All Events</option>
              <option value="login">Login Events</option>
              <option value="password">Password Events</option>
              <option value="security">Security Events</option>
            </select>
            
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              className="input-field text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No security events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    event.riskLevel === 'high' ? 'bg-red-500' :
                    event.riskLevel === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {event.userEmail && <span>User: {event.userEmail}</span>}
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                      {event.location && <span>Location: {event.location}</span>}
                    </div>
                    {event.details && (
                      <p className="text-sm text-gray-500 mt-2">{event.details}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(event.riskLevel)}`}>
                    {event.riskLevel.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Enable two-factor authentication for admin accounts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Review and clean up expired password reset tokens regularly</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span>Monitor for unusual login patterns and IP addresses</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Enforce strong password policies for all users</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Set up automated alerts for security events</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Consider implementing IP whitelisting for admin access</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}