'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { formatCardDate, formatCardTime } from '../utils/candidate-data-helpers'

const ActionRequired = ({
  needsFeedbackInterviews,
  showActionRequired,
  setShowActionRequired,
  onInterviewFeedback,
  candidate,
  onViewDetails
}) => {
  const needsFeedbackCount = needsFeedbackInterviews.length

  if (needsFeedbackCount === 0) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowActionRequired(!showActionRequired)}
        className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-lg transition-colors border-2 border-orange-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-orange-900 block">
              Action Required: {needsFeedbackCount} Interview
              {needsFeedbackCount > 1 ? "s" : ""} Need Feedback
            </span>
            <span className="text-sm text-orange-700">
              Click to {showActionRequired ? "hide" : "view"} pending
              feedback interviews
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-2 bg-orange-500 text-white rounded-full text-sm font-bold animate-bounce">
            URGENT
          </span>
          {showActionRequired ? (
            <ChevronUp className="w-5 h-5 text-orange-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-orange-600" />
          )}
        </div>
      </button>

      {/* Collapsible Action Required Content */}
      <AnimatePresence>
        {showActionRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-4 bg-white rounded-lg border-2 border-orange-200 shadow-sm">
              <div className="space-y-3">
                {needsFeedbackInterviews.slice(0, 3).map((interview, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-lg font-bold text-gray-900">
                          {interview.title}
                        </h5>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                          COMPLETED - NO FEEDBACK
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">
                          {formatCardDate(interview.scheduledAt)}
                        </span>
                        <span>
                          {formatCardTime(interview.scheduledAt)}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {interview.duration} min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onInterviewFeedback &&
                        onInterviewFeedback(interview, candidate)
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Submit Feedback Now
                    </button>
                  </div>
                ))}

                {needsFeedbackCount > 3 && (
                  <div className="text-center py-2">
                    <span className="text-sm font-medium text-orange-800">
                      +{needsFeedbackCount - 3} more interview
                      {needsFeedbackCount - 3 > 1 ? "s" : ""} need feedback
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ActionRequired