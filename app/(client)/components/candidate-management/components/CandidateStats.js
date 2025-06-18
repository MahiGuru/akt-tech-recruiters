'use client'

const CandidateStats = ({
  candidate,
  upcomingInterviews,
  interviewFeedback,
  needsFeedbackCount
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div className="text-lg font-bold text-gray-900">
          {candidate.interviews?.length || 0}
        </div>
        <div className="text-xs text-gray-600">Total Interviews</div>
      </div>
      
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="text-lg font-bold text-blue-700">
          {upcomingInterviews.length}
        </div>
        <div className="text-xs text-blue-600">Upcoming</div>
      </div>
      
      <div className="text-center p-3 bg-purple-50 rounded-lg">
        <div className="text-lg font-bold text-purple-700">
          {interviewFeedback?.totalFeedbacks || 0}
        </div>
        <div className="text-xs text-purple-600">Feedbacks</div>
      </div>
      
      <div className="text-center p-3 bg-orange-50 rounded-lg">
        <div className="text-lg font-bold text-orange-700">
          {needsFeedbackCount}
        </div>
        <div className="text-xs text-orange-600">Need Feedback</div>
      </div>
    </div>
  )
}

export default CandidateStats