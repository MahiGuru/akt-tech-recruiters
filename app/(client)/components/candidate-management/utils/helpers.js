
import { CANDIDATE_STATUSES, INTERVIEW_STATUSES, FEEDBACK_OUTCOMES } from './constants'

/**
 * Get status color class based on candidate status
 */
export const getStatusColor = (status) => {
  return CANDIDATE_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
}

/**
 * Get interview status color class
 */
export const getInterviewStatusColor = (status) => {
  return INTERVIEW_STATUSES[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get feedback outcome configuration
 */
export const getFeedbackConfig = (outcome) => {
  return FEEDBACK_OUTCOMES[outcome] || FEEDBACK_OUTCOMES.AVERAGE
}

/**
 * Format file size in readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file upload
 */
export const validateFile = (file, acceptedTypes, maxSize) => {
  if (!acceptedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PDF, DOC, DOCX, and TXT files are allowed' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' }
  }
  
  return { isValid: true }
}

/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format time for display
 */
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Check if interview needs feedback
 */
export const needsFeedback = (interview) => {
  const interviewTime = new Date(interview.scheduledAt)
  const now = new Date()
  const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
  
  return interviewEndTime <= now && 
         interview.status !== 'CANCELLED' && 
         !interview.feedbackSubmitted
}

/**
 * Check if interview is upcoming
 */
export const isUpcomingInterview = (interview) => {
  return new Date(interview.scheduledAt) > new Date() && 
         ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
}

/**
 * Filter candidates based on search and filters
 */
export const filterCandidates = (candidates, searchTerm, statusFilter, recruiterFilter) => {
  return candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    const matchesRecruiter = recruiterFilter === 'all' || candidate.addedById === recruiterFilter
    
    return matchesSearch && matchesStatus && matchesRecruiter
  })
}

/**
 * Sort candidates based on sort criteria
 */
export const sortCandidates = (candidates, sortBy, getCandidatePriority) => {
  return [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const priorityA = getCandidatePriority(a)
        const priorityB = getCandidatePriority(b)
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB // Lower number = higher priority
        }
        
        // If same priority, sort by created date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      case 'newest': 
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest': 
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'name': 
        return a.name.localeCompare(b.name)
      case 'status': 
        return a.status.localeCompare(b.status)
      default: 
        return 0
    }
  })
}

/**
 * Get display text for experience level
 */
export const getExperienceLabel = (level) => {
  return level?.replace('_', ' ').toLowerCase() || 'Not specified'
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
