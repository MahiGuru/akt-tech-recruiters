// app/(client)/components/EnhancedCandidateCard.js - With Interview History Toggle
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Meh, 
  Award, 
  Target, 
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Video,
  CheckCircle,
  AlertCircle,
  Timer,
  Briefcase,
  DollarSign,
  FileText,
  History,
  TrendingUp
} from 'lucide-react'

// Feedback outcome colors and icons
const getFeedbackConfig = (outcome) => {
  const configs = {
    'EXCELLENT': {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: ThumbsUp,
      bgGradient: 'from-green-50 to-emerald-50',
      description: 'Outstanding performance'
    },
    'GOOD': {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: ThumbsUp,
      bgGradient: 'from-blue-50 to-indigo-50',
      description: 'Good performance'
    },
    'AVERAGE': {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Meh,
      bgGradient: 'from-yellow-50 to-orange-50',
      description: 'Average performance'
    },
    'POOR': {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: ThumbsDown,
      bgGradient: 'from-red-50 to-pink-50',
      description: 'Below expectations'
    }
  }
  return configs[outcome] || configs['AVERAGE']
}

// Status colors
const getStatusColor = (status) => {
  const colors = {
    'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
    'PLACED': 'bg-blue-100 text-blue-800 border-blue-200',
    'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-200',
    'DO_NOT_CONTACT': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Interview status colors
const getInterviewStatusColor = (status) => {
  const colors = {
    'SCHEDULED': 'bg-blue-100 text-blue-800 border-blue-200',
    'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'COMPLETED': 'bg-purple-100 text-purple-800 border-purple-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
    'RESCHEDULED': 'bg-orange-100 text-orange-800 border-orange-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const EnhancedCandidateCard = ({ 
  candidate, 
  onViewDetails, 
  onEdit, 
  onScheduleInterview, 
  onManagePlacement,
  onInterviewFeedback,
  isExpanded, 
  onToggleExpand,
  isAdmin 
}) => {
  const [showInterviewHistory, setShowInterviewHistory] = useState(false)

  // Get interview feedback summary
  const interviewFeedback = useMemo(() => {
    if (!candidate.interviews || candidate.interviews.length === 0) return null
    
    const completedInterviews = candidate.interviews.filter(interview => 
      interview.feedbackSubmitted && interview.feedback
    )
    
    if (completedInterviews.length === 0) return null
    
    // Get latest feedback
    const latestFeedback = completedInterviews
      .sort((a, b) => new Date(b.feedbackSubmittedAt) - new Date(a.feedbackSubmittedAt))[0]
    
    // Calculate average ratings
    const ratingsSum = completedInterviews.reduce((sum, interview) => {
      const ratings = [
        interview.overallRating,
        interview.technicalRating,
        interview.communicationRating,
        interview.culturalFitRating
      ].filter(rating => rating !== null && rating !== undefined)
      
      return sum + (ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0)
    }, 0)
    
    const averageRating = completedInterviews.length > 0 ? ratingsSum / completedInterviews.length : 0
    
    return {
      latest: latestFeedback,
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedbacks: completedInterviews.length,
      positiveCount: completedInterviews.filter(i => ['EXCELLENT', 'GOOD'].includes(i.outcome)).length,
      recommended: completedInterviews.filter(i => i.wouldRecommendHiring === true).length
    }
  }, [candidate.interviews])

  // Get upcoming interviews (ALWAYS VISIBLE)
  const upcomingInterviews = useMemo(() => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => 
      new Date(interview.scheduledAt) > new Date() && 
      ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    ).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
  }, [candidate.interviews])

  // Get past interviews
  const pastInterviews = useMemo(() => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => 
      new Date(interview.scheduledAt) <= new Date()
    ).sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  }, [candidate.interviews])

  // Get interviews needing feedback
  const needsFeedbackInterviews = useMemo(() => {
    if (!candidate.interviews) return []
    return candidate.interviews.filter(interview => {
      const interviewTime = new Date(interview.scheduledAt)
      const now = new Date()
      const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
      
      return interviewEndTime <= now && 
             interview.status !== 'CANCELLED' && 
             !interview.feedbackSubmitted
    })
  }, [candidate.interviews])

  const needsFeedbackCount = needsFeedbackInterviews.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                  {candidate.status.replace('_', ' ')}
                </span>
                {candidate.status === 'PLACED' && (
                  <button
                    onClick={() => onManagePlacement(candidate)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                    title="Manage Placement Details"
                  >
                    <DollarSign className="w-3 h-3" />
                    Manage
                  </button>
                )}
                {isAdmin && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {candidate.addedBy?.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {candidate.phone}
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidate.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Feedback Button - PROMINENT if needed */}
            {needsFeedbackCount > 0 && (
              <button
                onClick={() => {
                  const needsFeedback = needsFeedbackInterviews[0]
                  if (needsFeedback && onInterviewFeedback) {
                    onInterviewFeedback(needsFeedback, candidate)
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-bold shadow-lg animate-pulse"
                title="Submit Interview Feedback"
              >
                <MessageSquare className="w-4 h-4" />
                Add Feedback ({needsFeedbackCount})
              </button>
            )}
            
            <button
              onClick={() => onScheduleInterview(candidate)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md"
              title="Schedule Interview"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewDetails(candidate)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(candidate)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleExpand(candidate.id)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{candidate.interviews?.length || 0}</div>
            <div className="text-xs text-gray-600">Total Interviews</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{upcomingInterviews.length}</div>
            <div className="text-xs text-blue-600">Upcoming</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">{interviewFeedback?.totalFeedbacks || 0}</div>
            <div className="text-xs text-purple-600">Feedbacks</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-700">{needsFeedbackCount}</div>
            <div className="text-xs text-orange-600">Need Feedback</div>
          </div>
        </div>

        {/* ALWAYS VISIBLE: Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-800">
                  {upcomingInterviews.length} Upcoming Interview{upcomingInterviews.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Timer className="w-3 h-3 inline mr-1" />
                Next: {new Date(upcomingInterviews[0].scheduledAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
              {upcomingInterviews.slice(0, 2).map((interview, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium text-gray-900">{interview.title}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                        {interview.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(interview.scheduledAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: new Date(interview.scheduledAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      <span>({interview.duration} min)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {interview.meetingLink && (
                      <a 
                        href={interview.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Join Meeting"
                      >
                        <Video className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              
              {upcomingInterviews.length > 2 && (
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    +{upcomingInterviews.length - 2} more interview{upcomingInterviews.length - 2 > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* URGENT: Interviews Needing Feedback */}
        {needsFeedbackCount > 0 && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-300 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-orange-900">
                    Action Required: {needsFeedbackCount} Interview{needsFeedbackCount > 1 ? 's' : ''} Need Feedback
                  </span>
                  <p className="text-sm text-orange-700">Please submit feedback for completed interviews</p>
                </div>
              </div>
              <span className="px-3 py-2 bg-orange-500 text-white rounded-full text-sm font-bold animate-bounce">
                URGENT
              </span>
            </div>
            
            <div className="space-y-3">
              {needsFeedbackInterviews.slice(0, 2).map((interview, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-orange-200 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-lg font-bold text-gray-900">{interview.title}</h5>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                        COMPLETED - NO FEEDBACK
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                      <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{interview.duration} min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onInterviewFeedback && onInterviewFeedback(interview, candidate)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Submit Feedback Now
                  </button>
                </div>
              ))}
              
              {needsFeedbackCount > 2 && (
                <div className="text-center py-2">
                  <span className="text-sm font-medium text-orange-800">
                    +{needsFeedbackCount - 2} more interview{needsFeedbackCount - 2 > 1 ? 's' : ''} need feedback
                  </span>
                  <button
                    onClick={() => onViewDetails(candidate)}
                    className="ml-3 text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    View All →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview History & Feedback Toggle */}
        {(pastInterviews.length > 0 || interviewFeedback) && (
          <div className="mb-4">
            <button
              onClick={() => setShowInterviewHistory(!showInterviewHistory)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <span className="font-medium text-gray-900 block">
                    Interview History & Feedback
                  </span>
                  <span className="text-sm text-gray-600">
                    {pastInterviews.length} interview{pastInterviews.length > 1 ? 's' : ''} completed
                    {interviewFeedback && (
                      <> • {interviewFeedback.totalFeedbacks} feedback{interviewFeedback.totalFeedbacks > 1 ? 's' : ''}</>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {interviewFeedback && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{interviewFeedback.averageRating}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getFeedbackConfig(interviewFeedback.latest.outcome).color}`}>
                      {interviewFeedback.latest.outcome}
                    </span>
                  </div>
                )}
                {showInterviewHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Collapsible Interview History Content */}
            <AnimatePresence>
              {showInterviewHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                    {/* Latest Feedback Summary */}
                    {interviewFeedback && (
                      <div className={`p-4 rounded-lg border bg-gradient-to-r ${getFeedbackConfig(interviewFeedback.latest.outcome).bgGradient} border-gray-200`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Latest Interview Feedback</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getFeedbackConfig(interviewFeedback.latest.outcome).color}`}>
                              {interviewFeedback.latest.outcome}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{interviewFeedback.averageRating} avg</span>
                            </div>
                            {interviewFeedback.latest.wouldRecommendHiring === true && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Recommended</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Interview:</span>
                            <span className="text-sm text-gray-900 ml-2">{interviewFeedback.latest.title}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Feedback:</span>
                            <p className="text-sm text-gray-900 mt-1">{interviewFeedback.latest.feedback}</p>
                          </div>
                          {interviewFeedback.latest.strengths && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Strengths:</span>
                              <p className="text-sm text-gray-900 mt-1">{interviewFeedback.latest.strengths}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-600">
                            {interviewFeedback.totalFeedbacks} total • {interviewFeedback.positiveCount} positive • {interviewFeedback.recommended} recommended
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(interviewFeedback.latest.feedbackSubmittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* All Past Interviews */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        All Interviews ({pastInterviews.length})
                      </h4>
                      <div className="space-y-3">
                        {pastInterviews.map((interview, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  interview.feedbackSubmitted ? 'bg-green-500' :
                                  interview.status === 'CANCELLED' ? 'bg-red-500' :
                                  'bg-orange-500'
                                }`}></div>
                                <span className="font-medium text-sm text-gray-900">{interview.title}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                                  {interview.status.replace('_', ' ')}
                                </span>
                                {interview.outcome && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getFeedbackConfig(interview.outcome).color}`}>
                                    {interview.outcome}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {interview.overallRating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{interview.overallRating}</span>
                                  </div>
                                )}
                                {interview.wouldRecommendHiring === true && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                {!interview.feedbackSubmitted && new Date(interview.scheduledAt) < new Date() && interview.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => onInterviewFeedback && onInterviewFeedback(interview, candidate)}
                                    className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                  >
                                    Add Feedback
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(interview.scheduledAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} • {interview.duration} minutes
                            </div>
                            {interview.feedback && (
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border">{interview.feedback}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Expanded Content (Skills, etc.) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 8).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 8 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{candidate.skills.length - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No skills listed</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{candidate.resumes?.length || 0} resume{candidate.resumes?.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>{candidate.applications?.length || 0} application{candidate.applications?.length !== 1 ? 's' : ''}</span>
                    </div>
                    {candidate.experience && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span>{candidate.experience} years experience</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio and Notes */}
              {(candidate.bio || candidate.notes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.bio && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                      <p className="text-sm text-gray-600">{candidate.bio}</p>
                    </div>
                  )}
                  {candidate.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{candidate.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default EnhancedCandidateCard