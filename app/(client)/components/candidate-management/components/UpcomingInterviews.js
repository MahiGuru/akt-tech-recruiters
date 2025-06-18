// app/(client)/components/candidate-card/components/UpcomingInterviews.js
'use client'

import { Calendar, Clock, Timer, Edit, Video } from 'lucide-react'
import { getInterviewStatusColor, formatCardDate, formatCardTime } from '../utils/candidate-data-helpers'

const UpcomingInterviews = ({
  upcomingInterviews,
  onRescheduleInterview,
  candidate
}) => {
  if (upcomingInterviews.length === 0) return null

  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <Calendar className="w-3 h-3 text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-800">
            {upcomingInterviews.length} Upcoming Interview
            {upcomingInterviews.length > 1 ? "s" : ""}
          </span>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <Timer className="w-3 h-3 inline mr-1" />
          Next: {formatCardDate(upcomingInterviews[0].scheduledAt)}
        </span>
      </div>

      <div className="space-y-2">
        {upcomingInterviews.slice(0, 2).map((interview, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-sm font-medium text-gray-900">
                  {interview.title}
                </h5>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getInterviewStatusColor(
                    interview.status
                  )}`}
                >
                  {interview.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatCardDate(interview.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatCardTime(interview.scheduledAt)}</span>
                </div>
                <span>({interview.duration} min)</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Reschedule Button */}
              <button
                onClick={() =>
                  onRescheduleInterview &&
                  onRescheduleInterview(interview, candidate)
                }
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Reschedule Interview"
              >
                <Edit className="w-3 h-3" />
              </button>
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
              +{upcomingInterviews.length - 2} more interview
              {upcomingInterviews.length - 2 > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingInterviews