// app/(client)/components/candidate-card/index.js
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import CardHeader from './components/CardHeader'
import UpcomingInterviews from './components/UpcomingInterviews'
import ActionRequired from './components/ActionRequired'
import InterviewHistory from './components/InterviewHistory'
import CandidateStats from './components/CandidateStats'
import ExpandedContent from './components/ExpandedContent'

// Utils and hooks
import { 
  getUpcomingInterviews, 
  getPastInterviews, 
  getNeedsFeedbackInterviews, 
  getInterviewFeedbackSummary,
  getCardStyling 
} from './utils/candidate-data-helpers'

const EnhancedCandidateCard = ({
  candidate,
  onViewDetails,
  onEdit,
  onScheduleInterview,
  onRescheduleInterview,
  onManagePlacement,
  onInterviewFeedback,
  isExpanded,
  onToggleExpand,
  isAdmin,
}) => {
  const [showInterviewHistory, setShowInterviewHistory] = useState(false)
  const [showActionRequired, setShowActionRequired] = useState(false)

  // Calculate interview data
  const upcomingInterviews = getUpcomingInterviews(candidate)
  const pastInterviews = getPastInterviews(candidate)
  const needsFeedbackInterviews = getNeedsFeedbackInterviews(candidate)
  const interviewFeedback = getInterviewFeedbackSummary(candidate)
  const needsFeedbackCount = needsFeedbackInterviews.length

  // Get card styling based on priority
  const cardStyling = getCardStyling(candidate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cardStyling.background} rounded-xl border-2 ${cardStyling.border} hover:shadow-lg transition-all duration-200 overflow-hidden ${cardStyling.shadow}`}
    >
      <div className="p-6">
        {/* Header */}
        <CardHeader
          candidate={candidate}
          isAdmin={isAdmin}
          needsFeedbackCount={needsFeedbackCount}
          showActionRequired={showActionRequired}
          setShowActionRequired={setShowActionRequired}
          onScheduleInterview={onScheduleInterview}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onToggleExpand={onToggleExpand}
          onManagePlacement={onManagePlacement}
          isExpanded={isExpanded}
        />

        {/* ALWAYS VISIBLE: Upcoming Interviews */}
        <UpcomingInterviews
          upcomingInterviews={upcomingInterviews}
          onRescheduleInterview={onRescheduleInterview}
          candidate={candidate}
        />

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* Quick Stats */}
            <CandidateStats
              candidate={candidate}
              upcomingInterviews={upcomingInterviews}
              interviewFeedback={interviewFeedback}
              needsFeedbackCount={needsFeedbackCount}
            />

            {/* URGENT: Interviews Needing Feedback - NOW TOGGLEABLE */}
            <ActionRequired
              needsFeedbackInterviews={needsFeedbackInterviews}
              showActionRequired={showActionRequired}
              setShowActionRequired={setShowActionRequired}
              onInterviewFeedback={onInterviewFeedback}
              candidate={candidate}
              onViewDetails={onViewDetails}
            />

            {/* Interview History & Feedback Toggle */}
            <InterviewHistory
              pastInterviews={pastInterviews}
              interviewFeedback={interviewFeedback}
              showInterviewHistory={showInterviewHistory}
              setShowInterviewHistory={setShowInterviewHistory}
              onInterviewFeedback={onInterviewFeedback}
              candidate={candidate}
            />

            {/* Expanded Content (Skills, etc.) */}
            <AnimatePresence>
              <ExpandedContent candidate={candidate} />
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default EnhancedCandidateCard