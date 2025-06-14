'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText,
  Users,
  Link as LinkIcon,
  Unlink,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  User,
  Mail,
  Star,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumeAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30') // days

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/recruiter/resumes/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const getExperienceColor = (level) => {
    const colors = {
      'ENTRY_LEVEL': 'bg-green-500',
      'MID_LEVEL': 'bg-blue-500',
      'SENIOR_LEVEL': 'bg-purple-500',
      'EXECUTIVE': 'bg-red-500',
      'FREELANCE': 'bg-yellow-500',
      'INTERNSHIP': 'bg-gray-500'
    }
    return colors[level] || 'bg-gray-400'
  }

  const getExperienceLabel = (level) => {
    return level?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || level
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  const { summary, experienceDistribution, candidateResumeStats, recentUploads } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Resume Analytics</h3>
          <p className="text-sm text-gray-600">
            Insights into your resume management and candidate database
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="input-field"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.totalResumes}</div>
              <div className="text-sm text-gray-600">Total Resumes</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.mappedResumes}</div>
              <div className="text-sm text-gray-600">Mapped to Candidates</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <Unlink className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">{summary.unmappedUserResumes}</div>
              <div className="text-sm text-gray-600">Unmapped User Resumes</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{summary.candidatesWithResumes}</div>
              <div className="text-sm text-gray-600">Candidates with Resumes</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.candidatesWithoutResumes}</div>
              <div className="text-sm text-gray-600">Need Resumes</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Experience Level Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold">Experience Level Distribution</h4>
          </div>
          
          {experienceDistribution.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No resume data available
            </div>
          ) : (
            <div className="space-y-3">
              {experienceDistribution.map((item, index) => {
                const total = experienceDistribution.reduce((sum, level) => sum + level.count, 0)
                const percentage = ((item.count / total) * 100).toFixed(1)
                
                return (
                  <motion.div
                    key={item.level}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {getExperienceLabel(item.level)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-2 rounded-full ${getExperienceColor(item.level)}`}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Candidate Resume Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold">Top Candidates by Resume Count</h4>
          </div>
          
          {candidateResumeStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No candidate data available
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {candidateResumeStats
                .filter(candidate => candidate.resumeCount > 0)
                .sort((a, b) => b.resumeCount - a.resumeCount)
                .slice(0, 10)
                .map((candidate, index) => (
                  <motion.div
                    key={candidate.candidateId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {candidate.candidateName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-bold text-gray-900">
                        {candidate.resumeCount}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Uploads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold">Recent Resume Uploads</h4>
        </div>
        
        {recentUploads?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent uploads
          </div>
        ) : (
          <div className="space-y-3">
            {recentUploads?.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{upload.title}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {upload.ownerType === 'candidate' ? (
                          <Users className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {upload.ownerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {upload.ownerEmail}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    upload.experienceLevel === 'ENTRY_LEVEL' ? 'bg-green-100 text-green-800' :
                    upload.experienceLevel === 'MID_LEVEL' ? 'bg-blue-100 text-blue-800' :
                    upload.experienceLevel === 'SENIOR_LEVEL' ? 'bg-purple-100 text-purple-800' :
                    upload.experienceLevel === 'EXECUTIVE' ? 'bg-red-100 text-red-800' :
                    upload.experienceLevel === 'FREELANCE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getExperienceLabel(upload.experienceLevel)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(upload.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {summary.mappedResumes > 0 
                  ? ((summary.mappedResumes / summary.totalResumes) * 100).toFixed(1)
                  : 0
                }%
              </div>
              <div className="text-blue-100">Mapping Rate</div>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {summary.candidatesWithResumes > 0 
                  ? ((summary.candidatesWithResumes / (summary.candidatesWithResumes + summary.candidatesWithoutResumes)) * 100).toFixed(1)
                  : 0
                }%
              </div>
              <div className="text-green-100">Candidates Ready</div>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {candidateResumeStats.reduce((avg, candidate) => avg + candidate.resumeCount, 0) / 
                 Math.max(candidateResumeStats.length, 1) || 0}
              </div>
              <div className="text-purple-100">Avg Resumes/Candidate</div>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}