// app/(client)/dashboard/recruiter/DashboardStats.js - Enhanced with Interview Stats
'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  FileText, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  AlertCircle,
  User,
  Timer,
  Video
} from 'lucide-react'

export default function DashboardStats({ stats, candidates, isAdmin, onTabChange }) {
  // Calculate upcoming interviews from candidates data
  const upcomingInterviews = candidates?.reduce((count, candidate) => {
    if (!candidate.interviews) return count
    
    const upcoming = candidate.interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledAt)
      const now = new Date()
      return interviewDate > now && ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    })
    
    return count + upcoming.length
  }, 0) || 0

  // Calculate interviews in next 24 hours
  const interviewsNext24h = candidates?.reduce((count, candidate) => {
    if (!candidate.interviews) return count
    
    const next24h = candidate.interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledAt)
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      return interviewDate > now && 
             interviewDate <= tomorrow && 
             ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    })
    
    return count + next24h.length
  }, 0) || 0

  // Calculate completed interviews
  const completedInterviews = candidates?.reduce((count, candidate) => {
    if (!candidate.interviews) return count
    
    const completed = candidate.interviews.filter(interview => 
      interview.status === 'COMPLETED'
    )
    
    return count + completed.length
  }, 0) || 0

  // Enhanced stats array with interview data
  const enhancedStats = [
    {
      title: 'Total Candidates',
      value: stats.total || candidates?.length || 0,
      subtitle: `${(stats.candidatesByStatus?.ACTIVE || 0)} active`,
      icon: Users,
      color: 'blue',
      trend: '+12%',
      isPositive: true,
      targetTab: 'candidates',
      description: 'View all candidates'
    },
    {
      title: 'Resume Database',
      value: stats.totalResumes || 0,
      subtitle: `${stats.mappedResumes || 0} mapped`,
      icon: FileText,
      color: 'green',
      trend: '+8%',
      isPositive: true,
      targetTab: 'resumes',
      description: 'Browse resume database'
    },
    {
      title: 'Upcoming Interviews',
      value: upcomingInterviews,
      subtitle: interviewsNext24h > 0 ? `${interviewsNext24h} in next 24h` : 'No interviews today',
      icon: Calendar,
      color: 'purple',
      trend: upcomingInterviews > 0 ? 'Active' : 'None',
      isPositive: upcomingInterviews > 0,
      urgent: interviewsNext24h > 0,
      targetTab: 'candidates',
      description: 'Manage interviews'
    },
    {
      title: 'Placements',
      value: stats.candidatesByStatus?.PLACED || 0,
      subtitle: `Placed`,
      icon: Target,
      color: 'orange',
      trend: 'Stable',
      isPositive: true,
      targetTab: 'candidates',
      description: 'View placed candidates'
    }
  ]

  // Additional admin stats
  if (isAdmin) {
    enhancedStats.unshift(
      {
        title: 'Team Size',
        value: stats.teamSize || 0,
        subtitle: 'Active recruiters',
        icon: User,
        color: 'indigo',
        trend: 'Stable',
        isPositive: true,
        targetTab: 'team',
        description: 'Manage team members'
      }
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-5 mb-8">
      {enhancedStats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            type: "spring",
            stiffness: 100
          }}
          onClick={() => onTabChange && stat.targetTab && onTabChange(stat.targetTab)}
          className={`
            relative overflow-hidden rounded-xl p-6 
            ${stat.urgent 
              ? 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-lg' 
              : 'bg-white border border-gray-200 shadow-sm'
            }
            ${onTabChange && stat.targetTab 
              ? 'hover:shadow-lg hover:scale-105 cursor-pointer transform transition-all duration-200' 
              : 'hover:shadow-md transition-all duration-200'
            }
            group
          `}
        >
          {/* Click indicator and tooltip */}
          {onTabChange && stat.targetTab && (
            <>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-6 h-6 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-800 bg-opacity-90 text-white text-xs px-2 py-1 rounded text-center">
                  Click to {stat.description}
                </div>
              </div>
            </>
          )}

          {/* Urgent indicator for upcoming interviews */}
          {stat.urgent && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}

          <div className="flex items-center justify-center mb-3">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
              ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' :
                stat.color === 'green' ? 'bg-green-100 text-green-600 group-hover:bg-green-200' :
                stat.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' :
                stat.color === 'orange' ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200' :
                stat.color === 'indigo' ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200' :
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200' :
                'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
              }
            `}>
              <stat.icon className="w-6 h-6" />
            </div>
            
            {/* Trend indicator */} 
          </div>

          <div className="space-y-1">
            <p className="text-sm text-center font-medium text-gray-600">{stat.title}</p>
            <p className={`
              text-2xl text-center font-bold transition-colors duration-200
              ${stat.urgent ? 'text-orange-900' : 'text-gray-900'}
            `}>
              {stat.value}
            </p>
            <p className={`
              text-sm transition-colors  text-center duration-200
              ${stat.urgent ? 'text-orange-700' : 'text-gray-500'}
            `}>
              {stat.subtitle}
            </p>
          </div>

          {/* Special indicators for interview-related stats */}
          {stat.title === 'Upcoming Interviews' && upcomingInterviews > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200  text-center">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Timer className="w-3 h-3" />
                <span>Next: Today</span>
              </div>
            </div>
          )}

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
        </motion.div>
      ))}


    </div>
  )
}