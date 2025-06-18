'use client'

import { Users, Mail, Phone, MapPin, Calendar, Eye, Edit, ChevronDown, ChevronUp, AlertCircle, IndianRupeeIcon } from 'lucide-react'
import { getStatusColor } from '../utils/helpers'

const CardHeader = ({
  candidate,
  isAdmin,
  needsFeedbackCount,
  showActionRequired,
  setShowActionRequired,
  onScheduleInterview,
  onViewDetails,
  onEdit,
  onToggleExpand,
  onManagePlacement,
  isExpanded
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {candidate.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                candidate.status
              )}`}
            >
              {candidate.status.replace("_", " ")}
            </span>
            {candidate.status === "PLACED" && (
              <button
                onClick={() => onManagePlacement(candidate)}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                title="Manage Placement Details"
              >
                <IndianRupeeIcon className="w-3 h-3" />
                Placed Details
              </button>
            )}
            {isAdmin && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {candidate.addedBy?.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {candidate.email}
            </div>
            {candidate.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {candidate.phone}
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {candidate.location}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Show small indicator if feedback needed but don't make it prominent */}
        {needsFeedbackCount > 0 && (
          <button
            onClick={() => setShowActionRequired(!showActionRequired)}
            className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 text-xs border border-orange-300"
            title="Toggle Action Required Section"
          >
            <AlertCircle className="w-3 h-3" />
            {needsFeedbackCount}
          </button>
        )}

        <button
          onClick={() => onScheduleInterview(candidate)}
          className="p-2 text-green-600 hover:bg-green-50 rounded-md"
          title="Schedule Interview"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewDetails(candidate)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(candidate)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleExpand(candidate.id)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

export default CardHeader