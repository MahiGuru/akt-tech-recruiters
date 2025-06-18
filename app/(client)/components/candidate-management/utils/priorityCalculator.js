/**
 * Calculate candidate priority based on interviews and status
 * Lower number = higher priority
 */
export const getCandidatePriority = (candidate) => {
    if (!candidate.interviews || candidate.interviews.length === 0) {
      // Candidates without interviews - lowest priority
      if (candidate.status === 'PLACED') return 5
      return 6
    }
  
    const now = new Date()
    
    // Check for upcoming interviews
    const upcomingInterviews = candidate.interviews.filter(interview => 
      new Date(interview.scheduledAt) > now && 
      ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    )
    
    if (upcomingInterviews.length > 0) {
      return 1 // Highest priority - upcoming interviews
    }
  
    // Check for interviews needing feedback
    const needsFeedbackInterviews = candidate.interviews.filter(interview => {
      const interviewTime = new Date(interview.scheduledAt)
      const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
      
      return interviewEndTime <= now && 
             interview.status !== 'CANCELLED' && 
             !interview.feedbackSubmitted
    })
    
    if (needsFeedbackInterviews.length > 0) {
      return 2 // Second priority - pending feedback
    }
  
    // Placed candidates
    if (candidate.status === 'PLACED') {
      return 3 // Third priority
    }
  
    // Active candidates with completed interviews
    if (candidate.status === 'ACTIVE') {
      return 4 // Fourth priority
    }
  
    // Other statuses
    return 5 // Lower priority
  }
  
  /**
   * Get priority label for display
   */
  export const getPriorityLabel = (priority) => {
    const labels = {
      1: { text: 'Upcoming Interview', color: 'bg-green-100 text-green-800' },
      2: { text: 'Needs Feedback', color: 'bg-orange-100 text-orange-800' },
      3: { text: 'Placed', color: 'bg-blue-100 text-blue-800' },
      4: { text: 'Active', color: 'bg-blue-50 text-blue-700' },
      5: { text: 'Standard', color: 'bg-gray-100 text-gray-700' },
      6: { text: 'No Interviews', color: 'bg-gray-50 text-gray-600' }
    }
    
    return labels[priority] || labels[5]
  }
  
  /**
   * Get candidates that need immediate attention
   */
  export const getHighPriorityCandidates = (candidates) => {
    return candidates.filter(candidate => getCandidatePriority(candidate) <= 2)
  }
  
  /**
   * Get upcoming interviews count across all candidates
   */
  export const getUpcomingInterviewsCount = (candidates) => {
    const now = new Date()
    
    return candidates.reduce((count, candidate) => {
      if (!candidate.interviews) return count
      
      const upcomingCount = candidate.interviews.filter(interview => 
        new Date(interview.scheduledAt) > now && 
        ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
      ).length
      
      return count + upcomingCount
    }, 0)
  }
  
  /**
   * Get feedback needed count across all candidates
   */
  export const getFeedbackNeededCount = (candidates) => {
    const now = new Date()
    
    return candidates.reduce((count, candidate) => {
      if (!candidate.interviews) return count
      
      const needsFeedbackCount = candidate.interviews.filter(interview => {
        const interviewTime = new Date(interview.scheduledAt)
        const interviewEndTime = new Date(interviewTime.getTime() + (interview.duration * 60 * 1000))
        
        return interviewEndTime <= now && 
               interview.status !== 'CANCELLED' && 
               !interview.feedbackSubmitted
      }).length
      
      return count + needsFeedbackCount
    }, 0)
  }