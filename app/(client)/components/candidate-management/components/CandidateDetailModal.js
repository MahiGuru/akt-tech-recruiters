'use client'

import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  X, Mail, Phone, MapPin, Briefcase, Users, FileText, Calendar, 
  Video, Edit, Eye, Download, Trash2, Star, MessageSquare, Crown, Shield, UserCheck
} from 'lucide-react'
import { getInterviewStatusColor } from '../utils/helpers'

const CandidateDetailModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  resumes,
  onScheduleInterview,
  onRescheduleInterview,
  onInterviewFeedback,
  isAdmin 
}) => {
  const { data: session } = useSession()

  const handleDeleteResume = async (resumeId, resumeTitle) => {
    if (!confirm(`Delete "${resumeTitle}"?`)) return

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Resume deleted successfully')
        // Re-fetch resumes would be handled by parent component
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete resume')
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast.error('Failed to delete resume')
    }
  }

  // Helper function to get recruiter type display info
  const getRecruiterTypeInfo = (recruiterType) => {
    const typeConfig = {
      'ADMIN': { icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Admin' },
      'LEAD': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Lead Recruiter' },
      'TA': { icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Technical Analyst' },
      'HR': { icon: Users, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'HR Specialist' },
      'CS': { icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100', label: 'Customer Success' },
      'JUNIOR': { icon: UserCheck, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Junior Recruiter' }
    }
    
    return typeConfig[recruiterType] || typeConfig['JUNIOR']
  }

  if (!isOpen || !candidate) return null

  const hierarchyInfo = candidate.hierarchyInfo
  const recruiterTypeInfo = getRecruiterTypeInfo(hierarchyInfo?.recruiterType)

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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{candidate.name}</h3>
              <p className="text-blue-100">{candidate.email}</p>
              
              {/* NEW: Hierarchy Information in Header */}
              {hierarchyInfo && (
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <recruiterTypeInfo.icon className="w-4 h-4" />
                    <span>Added by {candidate.addedBy?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs text-black">
                      {recruiterTypeInfo.label}
                    </span>
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs text-black">
                      Level {hierarchyInfo.level}
                    </span>
                    {hierarchyInfo.department && (
                      <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs text-black">
                        {hierarchyInfo.department}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Enhanced User Account Status */}
          {candidate.createdUserId && candidate.createdUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Team Member Account Created</h4>
                  <p className="text-sm text-green-700">This candidate has been converted to a team member</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">Role:</span>
                  <span className="ml-2">{candidate.createdUser.role}</span>
                  {candidate.createdUser.recruiterProfile && (
                    <span className="ml-1 text-green-600">
                      ({candidate.createdUser.recruiterProfile.recruiterType})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-green-600 font-medium">Account Email:</span>
                  <span className="ml-2">{candidate.createdUser.email}</span>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Created:</span>
                  <span className="ml-2">{new Date(candidate.userCreatedAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Created by:</span>
                  <span className="ml-2">{candidate.userCreator?.name || 'System'}</span>
                </div>
              </div>
            </div>
          )}
          {/* Basic Info with Enhanced Hierarchy Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{candidate.email}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Management Details</h4>
              <div className="space-y-2">
                {candidate.experience && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{candidate.experience} years experience</span>
                  </div>
                )}
                
                {/* Enhanced Recruiter Info */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${recruiterTypeInfo.bgColor}`}>
                      <recruiterTypeInfo.icon className={`w-4 h-4 ${recruiterTypeInfo.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {candidate.addedBy?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {recruiterTypeInfo.label}
                      </div>
                    </div>
                  </div>
                  
                  {hierarchyInfo && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Hierarchy Level:</span>
                        <span className="ml-2 font-medium">L{hierarchyInfo.level}</span>
                      </div>
                      {hierarchyInfo.department && (
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-2 font-medium">{hierarchyInfo.department}</span>
                        </div>
                      )}
                      {hierarchyInfo.reportingManager && hierarchyInfo.reportingManager.name !== 'No Manager' && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Reporting Manager:</span>
                          <span className="ml-2 font-medium">{hierarchyInfo.reportingManager.name}</span>
                          {hierarchyInfo.reportingManager.recruiterProfile?.recruiterType && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({hierarchyInfo.reportingManager.recruiterProfile.recruiterType})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interviews Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">
                Interviews ({candidate.interviews?.length || 0})
              </h4>
              <button
                onClick={() => {
                  onClose()
                  onScheduleInterview(candidate)
                }}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                Schedule Interview
              </button>
            </div>

            {!candidate.interviews || candidate.interviews.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h5>
                <p className="text-gray-600 mb-4">Schedule the first interview with this candidate</p>
                <button
                  onClick={() => {
                    onClose()
                    onScheduleInterview(candidate)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Schedule Interview
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {candidate.interviews.map((interview) => {
                  const isUpcoming = new Date(interview.scheduledAt) > new Date()
                  const needsFeedback = !interview.feedbackSubmitted && !isUpcoming
                  
                  return (
                    <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h6 className="font-medium text-gray-900">{interview.title}</h6>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterviewStatusColor(interview.status)}`}>
                              {interview.status.replace('_', ' ')}
                            </span>
                            {needsFeedback && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <MessageSquare className="w-3 h-3 inline mr-1" />
                                Needs Feedback
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                            <span>{new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{interview.duration} min</span>
                          </div>
                          {interview.description && (
                            <p className="text-sm text-gray-600 mt-1">{interview.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {needsFeedback && (
                          <button
                            onClick={() => {
                              onClose()
                              onInterviewFeedback(interview, candidate)
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-md"
                            title="Add Feedback"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        {isUpcoming && (
                          <button
                            onClick={() => {
                              onClose()
                              onRescheduleInterview(interview, candidate)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Reschedule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Join Meeting"
                          >
                            <Video className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resumes Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Resumes ({resumes.length})</h4>
            </div>

            {resumes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h5>
                <p className="text-gray-600">Use the Edit button to add resumes for this candidate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-medium text-gray-900">{resume.title || resume.originalName}</h6>
                          {resume.isPrimary && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{resume.experienceLevel?.replace('_', ' ').toLowerCase()}</span>
                          <span>{(resume.fileSize / 1024).toFixed(1)} KB</span>
                          <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(resume.url, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={resume.url}
                        download
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(isAdmin || candidate.addedById === session?.user?.id) && (
                        <button
                          onClick={() => handleDeleteResume(resume.id, resume.title || resume.originalName)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bio and Notes */}
          {(candidate.bio || candidate.notes) && (
            <div className="space-y-4">
              {candidate.bio && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Bio</h4>
                  <p className="text-gray-600">{candidate.bio}</p>
                </div>
              )}
              {candidate.notes && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Notes</h4>
                  <p className="text-gray-600">{candidate.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CandidateDetailModal