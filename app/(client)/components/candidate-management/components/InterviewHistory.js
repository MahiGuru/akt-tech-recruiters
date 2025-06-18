// app/(client)/components/candidate-card/components/InterviewHistory.js
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { History, ChevronDown, ChevronUp, Award, Star, CheckCircle, Calendar } from 'lucide-react'
import { getFeedbackConfig, getInterviewStatusColor, formatCardDate, formatCardTime } from '../utils/candidate-data-helpers'

const InterviewHistory = ({
  pastInterviews,
  interviewFeedback,
  showInterviewHistory,
  setShowInterviewHistory,
  onInterviewFeedback,
  candidate
}) => {
  if (pastInterviews.length === 0 && !interviewFeedback) return null

  return (
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
              {pastInterviews.length} interview
              {pastInterviews.length > 1 ? "s" : ""} completed
              {interviewFeedback && (
                <>
                  {" "}
                  • {interviewFeedback.totalFeedbacks} feedback
                  {interviewFeedback.totalFeedbacks > 1 ? "s" : ""}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {interviewFeedback && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">
                  {interviewFeedback.averageRating}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  getFeedbackConfig(interviewFeedback.latest.outcome).color
                }`}
              >
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Latest Feedback Summary */}
              {interviewFeedback && (
                <div
                  className={`p-4 rounded-lg border bg-gradient-to-r ${
                    getFeedbackConfig(interviewFeedback.latest.outcome).bgGradient
                  } border-gray-200`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        Latest Interview Feedback
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          getFeedbackConfig(interviewFeedback.latest.outcome).color
                        }`}
                      >
                        {interviewFeedback.latest.outcome}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {interviewFeedback.averageRating} avg
                        </span>
                      </div>
                      {interviewFeedback.latest.wouldRecommendHiring === true && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Interview:
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {interviewFeedback.latest.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Feedback:
                      </span>
                      <p className="text-sm text-gray-900 mt-1">
                        {interviewFeedback.latest.feedback}
                      </p>
                    </div>
                    {interviewFeedback.latest.strengths && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Strengths:
                        </span>
                        <p className="text-sm text-gray-900 mt-1">
                          {interviewFeedback.latest.strengths}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      {interviewFeedback.totalFeedbacks} total •{" "}
                      {interviewFeedback.positiveCount} positive •{" "}
                      {interviewFeedback.recommended} recommended
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(
                        interviewFeedback.latest.feedbackSubmittedAt
                      ).toLocaleDateString()}
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
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              interview.feedbackSubmitted
                                ? "bg-green-500"
                                : interview.status === "CANCELLED"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <span className="font-medium text-sm text-gray-900">
                            {interview.title}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(
                              interview.status
                            )}`}
                          >
                            {interview.status.replace("_", " ")}
                          </span>
                          {interview.outcome && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                getFeedbackConfig(interview.outcome).color
                              }`}
                            >
                              {interview.outcome}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {interview.overallRating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">
                                {interview.overallRating}
                              </span>
                            </div>
                          )}
                          {interview.wouldRecommendHiring === true && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {!interview.feedbackSubmitted &&
                            new Date(interview.scheduledAt) < new Date() &&
                            interview.status !== "CANCELLED" && (
                              <button
                                onClick={() =>
                                  onInterviewFeedback &&
                                  onInterviewFeedback(interview, candidate)
                                }
                                className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                              >
                                Add Feedback
                              </button>
                            )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {formatCardDate(interview.scheduledAt)} at{" "}
                        {formatCardTime(interview.scheduledAt)} • {interview.duration} minutes
                      </div>
                      {interview.feedback && (
                        <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                          {interview.feedback}
                        </p>
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
  )
}

export default InterviewHistory