
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  MessageSquare,
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  Meh
} from 'lucide-react'

const INTERVIEW_OUTCOMES = [
  { 
    value: 'EXCELLENT', 
    label: 'Excellent', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: ThumbsUp,
    description: 'Outstanding performance, highly recommended'
  },
  { 
    value: 'GOOD', 
    label: 'Good', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ThumbsUp,
    description: 'Good performance, meets requirements'
  },
  { 
    value: 'AVERAGE', 
    label: 'Average', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Meh,
    description: 'Average performance, some concerns'
  },
  { 
    value: 'POOR', 
    label: 'Poor', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: ThumbsDown,
    description: 'Below expectations, not recommended'
  }
]

const NEXT_STEPS = [
  { value: 'PROCEED_TO_NEXT_ROUND', label: 'Proceed to Next Round' },
  { value: 'MAKE_OFFER', label: 'Make Job Offer' },
  { value: 'NEED_FOLLOW_UP', label: 'Need Follow-up Interview' },
  { value: 'HOLD_FOR_REVIEW', label: 'Hold for Review' },
  { value: 'REJECT', label: 'Reject Candidate' },
  { value: 'UNDECIDED', label: 'Need More Time to Decide' }
]

const InterviewFeedbackModal = ({ 
  isOpen, 
  onClose, 
  interview, 
  candidate, 
  onFeedbackSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({
    status: 'COMPLETED',
    outcome: '',
    overallRating: 5,
    technicalRating: 5,
    communicationRating: 5,
    culturalFitRating: 5,
    strengths: '',
    weaknesses: '',
    feedback: '',
    nextSteps: '',
    recommendations: '',
    wouldRecommendHiring: null
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && interview) {
      setFeedback({
        status: 'COMPLETED',
        outcome: '',
        overallRating: 5,
        technicalRating: 5,
        communicationRating: 5,
        culturalFitRating: 5,
        strengths: '',
        weaknesses: '',
        feedback: '',
        nextSteps: '',
        recommendations: '',
        wouldRecommendHiring: null
      })
    }
  }, [isOpen, interview])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!feedback.outcome || !feedback.feedback.trim()) {
      toast.error('Interview outcome and feedback are required')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Update interview with feedback
      const response = await fetch('/api/recruiter/interviews/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          ...feedback
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Interview feedback submitted successfully!')
        onFeedbackSubmit(data.interview)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const RatingStars = ({ rating, onChange, label, disabled = false }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            disabled={disabled}
            className={`p-1 rounded ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star 
              className={`w-5 h-5 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (!isOpen || !interview || !candidate) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-1">Interview Feedback</h3>
              <p className="text-blue-100">{interview.title} with {candidate.name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{interview.duration} minutes</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interview Outcome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Outcome *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {INTERVIEW_OUTCOMES.map((outcome) => (
                  <button
                    key={outcome.value}
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, outcome: outcome.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      feedback.outcome === outcome.value
                        ? outcome.color + ' border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-3">
                      <outcome.icon className={`w-5 h-5 ${
                        feedback.outcome === outcome.value 
                          ? 'text-current' 
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium">{outcome.label}</div>
                        <div className="text-xs text-gray-500">{outcome.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ratings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Performance Ratings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RatingStars
                  rating={feedback.overallRating}
                  onChange={(rating) => setFeedback(prev => ({ ...prev, overallRating: rating }))}
                  label="Overall Performance"
                  disabled={isSubmitting}
                />
                <RatingStars
                  rating={feedback.technicalRating}
                  onChange={(rating) => setFeedback(prev => ({ ...prev, technicalRating: rating }))}
                  label="Technical Skills"
                  disabled={isSubmitting}
                />
                <RatingStars
                  rating={feedback.communicationRating}
                  onChange={(rating) => setFeedback(prev => ({ ...prev, communicationRating: rating }))}
                  label="Communication"
                  disabled={isSubmitting}
                />
                <RatingStars
                  rating={feedback.culturalFitRating}
                  onChange={(rating) => setFeedback(prev => ({ ...prev, culturalFitRating: rating }))}
                  label="Cultural Fit"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Hiring Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Would you recommend hiring this candidate? *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, wouldRecommendHiring: true }))}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    feedback.wouldRecommendHiring === true
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-5 h-5" />
                  Yes, Recommend
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, wouldRecommendHiring: false }))}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    feedback.wouldRecommendHiring === false
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-5 h-5" />
                  No, Dont Recommend
                </button>
              </div>
            </div>

            {/* Feedback Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strengths & Positive Aspects
                </label>
                <textarea
                  value={feedback.strengths}
                  onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="What did the candidate do well?"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Improvement
                </label>
                <textarea
                  value={feedback.weaknesses}
                  onChange={(e) => setFeedback(prev => ({ ...prev, weaknesses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="What could be improved?"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Overall Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Feedback *
              </label>
              <textarea
                value={feedback.feedback}
                onChange={(e) => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Provide detailed feedback about the interview..."
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Next Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Next Steps
              </label>
              <select
                value={feedback.nextSteps}
                onChange={(e) => setFeedback(prev => ({ ...prev, nextSteps: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select next steps...</option>
                {NEXT_STEPS.map(step => (
                  <option key={step.value} value={step.value}>{step.label}</option>
                ))}
              </select>
            </div>

            {/* Additional Recommendations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Recommendations
              </label>
              <textarea
                value={feedback.recommendations}
                onChange={(e) => setFeedback(prev => ({ ...prev, recommendations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any additional recommendations or notes..."
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default InterviewFeedbackModal