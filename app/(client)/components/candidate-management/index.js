// app/(client)/components/candidate-management/index.js (Updated with User Creation)
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus } from 'lucide-react'

// Hooks
import { useCandidateData } from './hooks/useCandidateData'

// Components
import FilterSection from './components/FilterSection'
import CandidateForm from './components/CandidateForm'
import InterviewSchedulingModal from './components/InterviewSchedulingModal'
import CandidateDetailModal from './components/CandidateDetailModal'
import EnhancedCandidateCard from './CandidateCard'
import InterviewFeedbackModal from '../InterviewFeedbackModal'
import PlacementManagement from './PlacementManagement'
import CreateUserModal from './components/CreateUserModal' // NEW

// Utils
import { getCandidatePriority } from './utils/priorityCalculator'
import { filterCandidates, sortCandidates } from './utils/helpers'

const CandidateManagement = () => {
  const {
    // Data
    candidates,
    teamMembers,
    resumes,
    loading,
    isAdmin,
    
    // Actions
    addCandidate,
    updateCandidate,
    deleteCandidate,
    updateCandidateStatus,
    getCandidateDetails,
    updateCandidateInterview,
    updateCandidatePlacement,
    fetchResumes,
    setCandidates // NEW: For updating local state after user creation
  } = useCandidateData()

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recruiterFilter, setRecruiterFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')
  const [expandedCards, setExpandedCards] = useState(new Set())

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false) // NEW
  
  // Selected items
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [editingInterview, setEditingInterview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtered and sorted candidates
  const filteredCandidates = useMemo(() => {
    const filtered = filterCandidates(candidates, searchTerm, statusFilter, recruiterFilter)
    return sortCandidates(filtered, sortBy, getCandidatePriority)
  }, [candidates, searchTerm, statusFilter, recruiterFilter, sortBy])

  // Event Handlers
  const handleAddCandidate = async (formData, resumeInfo) => {
    setIsSubmitting(true)
    const result = await addCandidate(formData, resumeInfo)
    setIsSubmitting(false)
    
    if (result.success) {
      setShowAddModal(false)
    }
  }

  const handleUpdateCandidate = async (formData, resumeInfo) => {
    setIsSubmitting(true)
    const result = await updateCandidate(selectedCandidate.id, formData, resumeInfo)
    setIsSubmitting(false)
    
    if (result.success) {
      setShowEditModal(false)
      setSelectedCandidate(null)
    }
  }

  const handleViewDetails = async (candidate) => {
    const result = await getCandidateDetails(candidate.id)
    if (result.success) {
      setSelectedCandidate(result.candidate)
      setShowDetailModal(true)
      fetchResumes(candidate.id)
    }
  }

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate)
    setEditingInterview(null)
    setShowInterviewModal(true)
  }

  const handleRescheduleInterview = (interview, candidate) => {
    setSelectedCandidate(candidate)
    setEditingInterview(interview)
    setShowInterviewModal(true)
  }

  const handleInterviewFeedback = (interview, candidate) => {
    setSelectedInterview(interview)
    setSelectedCandidate(candidate)
    setShowFeedbackModal(true)
  }

  const handleManagePlacement = (candidate) => {
    setSelectedCandidate(candidate)
    setShowPlacementModal(true)
  }

  // NEW: User creation handler
  const handleCreateUser = (candidate) => {
    setSelectedCandidate(candidate)
    setShowCreateUserModal(true)
  }

  // NEW: Handle successful user creation
  const handleUserCreated = (result) => {
    // Update the candidate in local state with user creation info
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => 
        candidate.id === result.candidate.id 
          ? {
              ...candidate,
              createdUserId: result.candidate.createdUserId,
              userCreatedAt: result.candidate.userCreatedAt,
              createdUser: result.user
            }
          : candidate
      )
    )

    // Update selectedCandidate if it's the same one
    if (selectedCandidate?.id === result.candidate.id) {
      setSelectedCandidate(prev => ({
        ...prev,
        createdUserId: result.candidate.createdUserId,
        userCreatedAt: result.candidate.userCreatedAt,
        createdUser: result.user
      }))
    }
  }

  const handleInterviewScheduleSuccess = (interviewData) => {
    updateCandidateInterview(interviewData, editingInterview)
    
    // Update selectedCandidate if it's the same candidate
    if (selectedCandidate?.id === interviewData.candidateId) {
      setSelectedCandidate(prev => {
        if (editingInterview) {
          return {
            ...prev,
            interviews: prev.interviews.map(interview =>
              interview.id === editingInterview.id ? interviewData : interview
            )
          }
        } else {
          return {
            ...prev,
            interviews: [...(prev.interviews || []), interviewData]
          }
        }
      })
    }
  }

  const handleFeedbackSubmitSuccess = (updatedInterview) => {
    updateCandidateInterview(updatedInterview, updatedInterview)
    
    // Update selectedCandidate if it's the same candidate
    if (selectedCandidate?.id === updatedInterview.candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        interviews: prev.interviews.map(interview =>
          interview.id === updatedInterview.id ? updatedInterview : interview
        )
      }))
    }

    setShowFeedbackModal(false)
    setSelectedInterview(null)
  }

  const handlePlacementUpdate = (updatedPlacement) => {
    updateCandidatePlacement(updatedPlacement)
    
    // Update selected candidate if it's the same one
    if (selectedCandidate?.id === updatedPlacement.candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        status: 'PLACED',
        placement: updatedPlacement
      }))
    }
  }

  const toggleExpanded = (candidateId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'All Team Candidates' : 'Manage Candidates'}
          </h2>
          <p className="text-gray-600">
            {isAdmin 
              ? `View and manage candidates from all team members (${filteredCandidates.length} total)`
              : `Add, edit, and track your candidates (${filteredCandidates.length} total)`
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Filters */}
      <FilterSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        recruiterFilter={recruiterFilter}
        setRecruiterFilter={setRecruiterFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        teamMembers={teamMembers}
        isAdmin={isAdmin}
      />

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || recruiterFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Start by adding your first candidate'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add First Candidate
            </button>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <EnhancedCandidateCard
              key={candidate.id}
              candidate={candidate}
              onViewDetails={handleViewDetails}
              onEdit={(candidate) => {
                setSelectedCandidate(candidate)
                setShowEditModal(true)
              }}
              onScheduleInterview={handleScheduleInterview}
              onRescheduleInterview={handleRescheduleInterview}
              onManagePlacement={handleManagePlacement}
              onCreateUser={handleCreateUser} // NEW: Pass user creation handler
              onInterviewFeedback={handleInterviewFeedback}
              isExpanded={expandedCards.has(candidate.id)}
              onToggleExpand={toggleExpanded}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Candidate Modal */}
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Add New Candidate</h3>
              </div>
              <div className="p-6">
                <CandidateForm
                  onSubmit={handleAddCandidate}
                  onCancel={() => setShowAddModal(false)}
                  teamMembers={teamMembers}
                  isAdmin={isAdmin}
                  isUploading={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Candidate Modal */}
        {showEditModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Edit {selectedCandidate.name}</h3>
              </div>
              <div className="p-6">
                <CandidateForm
                  candidate={selectedCandidate}
                  onSubmit={handleUpdateCandidate}
                  onCancel={() => {
                    setShowEditModal(false)
                    setSelectedCandidate(null)
                  }}
                  teamMembers={teamMembers}
                  isAdmin={isAdmin}
                  isUploading={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Interview Scheduling Modal */}
        {showInterviewModal && (
          <InterviewSchedulingModal
            isOpen={showInterviewModal}
            onClose={() => {
              setShowInterviewModal(false)
              setSelectedCandidate(null)
              setEditingInterview(null)
            }}
            candidate={selectedCandidate}
            editingInterview={editingInterview}
            onScheduleSuccess={handleInterviewScheduleSuccess}
          />
        )}

        {/* Interview Feedback Modal */}
        {showFeedbackModal && selectedInterview && selectedCandidate && (
          <InterviewFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => {
              setShowFeedbackModal(false)
              setSelectedInterview(null)
              setSelectedCandidate(null)
            }}
            interview={selectedInterview}
            candidate={selectedCandidate}
            onFeedbackSubmit={handleFeedbackSubmitSuccess}
          />
        )}

        {/* Placement Management Modal */}
        {showPlacementModal && selectedCandidate && (
          <PlacementManagement
            isOpen={showPlacementModal}
            onClose={() => {
              setShowPlacementModal(false)
              setSelectedCandidate(null)
            }}
            candidate={selectedCandidate}
            onPlacementUpdate={handlePlacementUpdate}
          />
        )}

        {/* NEW: Create User Modal */}
        {showCreateUserModal && selectedCandidate && (
          <CreateUserModal
            isOpen={showCreateUserModal}
            onClose={() => {
              setShowCreateUserModal(false)
              setSelectedCandidate(null)
            }}
            candidate={selectedCandidate}
            onUserCreated={handleUserCreated}
          />
        )}

        {/* Candidate Detail Modal */}
        {showDetailModal && selectedCandidate && (
          <CandidateDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedCandidate(null)
            }}
            candidate={selectedCandidate}
            resumes={resumes}
            onScheduleInterview={handleScheduleInterview}
            onRescheduleInterview={handleRescheduleInterview}
            onInterviewFeedback={handleInterviewFeedback}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CandidateManagement