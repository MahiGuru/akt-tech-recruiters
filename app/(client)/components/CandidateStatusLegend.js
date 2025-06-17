// app/(client)/components/CandidateStatusLegend.js - Visual Legend for Card Colors
'use client'

import { Calendar, AlertCircle, Award, Users, Pause } from 'lucide-react'

const CandidateStatusLegend = ({ className = '' }) => {
  const statusItems = [
    {
      icon: Calendar,
      label: 'Upcoming Interviews',
      color: 'border-green-300 bg-green-50',
      textColor: 'text-green-700',
      description: 'Candidates with scheduled interviews'
    },
    {
      icon: AlertCircle,
      label: 'Action Required',
      color: 'border-orange-300 bg-orange-50',
      textColor: 'text-orange-700',
      description: 'Interviews needing feedback'
    },
    {
      icon: Award,
      label: 'Placed',
      color: 'border-blue-300 bg-blue-50',
      textColor: 'text-blue-700',
      description: 'Successfully placed candidates'
    },
    {
      icon: Users,
      label: 'Active',
      color: 'border-gray-200 bg-white',
      textColor: 'text-gray-700',
      description: 'Active candidates'
    },
    {
      icon: Pause,
      label: 'Inactive/Other',
      color: 'border-gray-300 bg-gray-50',
      textColor: 'text-gray-600',
      description: 'Inactive or do not contact'
    }
  ]

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Card Color Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statusItems.map((item, index) => (
          <div key={index} className={`flex items-center gap-2 p-2 rounded-md border ${item.color}`}>
            <item.icon className={`w-4 h-4 ${item.textColor}`} />
            <div>
              <div className={`text-xs font-medium ${item.textColor}`}>
                {item.label}
              </div>
              <div className="text-xs text-gray-500">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CandidateStatusLegend