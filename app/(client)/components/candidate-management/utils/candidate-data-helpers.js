// app/(client)/components/candidate-card/utils/helpers.js

import { FEEDBACK_CONFIGS, STATUS_COLORS, INTERVIEW_STATUS_COLORS, CARD_PRIORITY_STYLES } from './constants'

/**
 * Get feedback configuration for outcome
 */
export const getFeedbackConfig = (outcome) => {
  return FEEDBACK_CONFIGS[outcome] || FEEDBACK_CONFIGS.AVERAGE
}

/**
 * Get status color configuration
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"
}

/**
 * Get interview status color configuration
 */
export const getInterviewStatusColor = (status) => {
  return INTERVIEW_STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"
}

/**
 * Get upcoming interviews for a candidate
 */
export const getUpcomingInterviews = (candidate) => {
  if (!candidate.interviews) return []
  
  return candidate.interviews
    .filter(interview =>
      new Date(interview.scheduledAt) > new Date() &&
      ['SCHEDULED', 'CONFIRMED'].includes(interview.status)
    )
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
}

/**
 * Get past interviews for a candidate
 */
export const getPastInterviews = (candidate) => {
  if (!candidate.interviews) return []
  
  return candidate.interviews
    .filter(interview => new Date(interview.scheduledAt) <= new Date())
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
}

/**
 * Get interviews needing feedback
 */
export const getNeedsFeedbackInterviews = (candidate) => {
  if (!candidate.interviews) return []
  
  return candidate.interviews.filter(interview => {
    const interviewTime = new Date(interview.scheduledAt)
    const now = new Date()
    const interviewEndTime = new Date(
      interviewTime.getTime() + interview.duration * 60 * 1000
    )

    return (
      interviewEndTime <= now &&
      interview.status !== "CANCELLED" &&
      !interview.feedbackSubmitted
    )
  })
}

/**
 * Get interview feedback summary
 */
export const getInterviewFeedbackSummary = (candidate) => {
  if (!candidate.interviews || candidate.interviews.length === 0) return null

  const completedInterviews = candidate.interviews.filter(
    interview => interview.feedbackSubmitted && interview.feedback
  )

  if (completedInterviews.length === 0) return null

  // Get latest feedback
  const latestFeedback = completedInterviews.sort(
    (a, b) => new Date(b.feedbackSubmittedAt) - new Date(a.feedbackSubmittedAt)
  )[0]

  // Calculate average ratings
  const ratingsSum = completedInterviews.reduce((sum, interview) => {
    const ratings = [
      interview.overallRating,
      interview.technicalRating,
      interview.communicationRating,
      interview.culturalFitRating,
    ].filter(rating => rating !== null && rating !== undefined)

    return (
      sum +
      (ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0)
    )
  }, 0)

  const averageRating =
    completedInterviews.length > 0
      ? ratingsSum / completedInterviews.length
      : 0

  return {
    latest: latestFeedback,
    averageRating: Math.round(averageRating * 10) / 10,
    totalFeedbacks: completedInterviews.length,
    positiveCount: completedInterviews.filter(i =>
      ["EXCELLENT", "GOOD"].includes(i.outcome)
    ).length,
    recommended: completedInterviews.filter(
      i => i.wouldRecommendHiring === true
    ).length,
  }
}

/**
 * Get card styling based on priority and status
 */
export const getCardStyling = (candidate) => {
  const upcomingInterviews = getUpcomingInterviews(candidate)
  const needsFeedbackCount = getNeedsFeedbackInterviews(candidate).length

  // Priority 1: Upcoming interviews - Green
  if (upcomingInterviews.length > 0) {
    return CARD_PRIORITY_STYLES.upcoming
  }

  // Priority 2: Needs feedback - Orange
  if (needsFeedbackCount > 0 && candidate.status !== "PLACED") {
    return CARD_PRIORITY_STYLES.feedback_needed
  }

  // Priority 3: Placed candidates - Blue
  if (candidate.status === "PLACED") {
    return CARD_PRIORITY_STYLES.placed
  }

  // Grey for inactive/do not contact
  if (
    candidate.status === "INACTIVE" ||
    candidate.status === "DO_NOT_CONTACT"
  ) {
    return CARD_PRIORITY_STYLES.inactive
  }

  // Default for active candidates
  return CARD_PRIORITY_STYLES.default
}

/**
 * Format date for card display
 */
export const formatCardDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: new Date(date).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

/**
 * Format time for card display
 */
export const formatCardTime = (date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Truncate skills for display
 */
export const getTruncatedSkills = (skills, maxCount = 8) => {
  if (!skills || skills.length === 0) return { visible: [], remaining: 0 }
  
  return {
    visible: skills.slice(0, maxCount),
    remaining: Math.max(0, skills.length - maxCount)
  }
}