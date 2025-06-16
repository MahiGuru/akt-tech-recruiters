// app/(client)/components/CandidateManagement.js (Fixed Version)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Link as LinkIcon,
  Video,
  Settings,
  Download
} from 'lucide-react'

// Move CandidateForm outside the main component to prevent recreation
const CandidateForm = ({ 
  candidateForm, 
  setCandidateForm, 
  newSkill, 
  setNewSkill, 
  teamMembers, 
  candidateStatuses, 
  isAdmin, 
  isEdit, 
  onSubmit, 
  onCancel,
  addSkill,
  removeSkill 
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="form-group">
        <label htmlFor="name" className="form-label required">Full Name</label>
        <input
          id="name"
          type="text"
          value={candidateForm.name}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
          className="input-field"
          required
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label required">Email</label>
        <input
          id="email"
          type="email"
          value={candidateForm.email}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, email: e.target.value }))}
          className="input-field"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">Phone Number</label>
        <input
          id="phone"
          type="tel"
          value={candidateForm.phone}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, phone: e.target.value }))}
          className="input-field"
          autoComplete="tel"
        />
      </div>

      <div className="form-group">
        <label htmlFor="location" className="form-label">Location</label>
        <input
          id="location"
          type="text"
          value={candidateForm.location}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, location: e.target.value }))}
          className="input-field"
          autoComplete="address-level2"
        />
      </div>

      <div className="form-group">
        <label htmlFor="experience" className="form-label">Years of Experience</label>
        <input
          id="experience"
          type="number"
          min="0"
          max="50"
          value={candidateForm.experience}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, experience: e.target.value }))}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label htmlFor="status" className="form-label">Status</label>
        <select
          id="status"
          value={candidateForm.status}
          onChange={(e) => setCandidateForm(prev => ({ ...prev, status: e.target.value }))}
          className="input-field"
        >
          {candidateStatuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Admin can assign to specific recruiter */}
      {isAdmin && !isEdit && (
        <div className="form-group md:col-span-2">
          <label htmlFor="addedById" className="form-label">Assign to Recruiter</label>
          <select
            id="addedById"
            value={candidateForm.addedById}
            onChange={(e) => setCandidateForm(prev => ({ ...prev, addedById: e.target.value }))}
            className="input-field"
          >
            <option value="">Assign to myself</option>
            {teamMembers.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.user.name} ({member.recruiterType})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>

    <div className="form-group">
      <label htmlFor="source" className="form-label">Source</label>
      <input
        id="source"
        type="text"
        value={candidateForm.source}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, source: e.target.value }))}
        className="input-field"
        placeholder="e.g., LinkedIn, Referral, Job Board"
      />
    </div>

    <div className="form-group">
      <label className="form-label">Skills</label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="input-field flex-1"
            placeholder="Add a skill"
          />
          <button
            type="button"
            onClick={addSkill}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {candidateForm.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidateForm.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="bio" className="form-label">Bio</label>
      <textarea
        id="bio"
        value={candidateForm.bio}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, bio: e.target.value }))}
        className="input-field"
        rows={3}
        placeholder="Brief description about the candidate..."
      />
    </div>

    <div className="form-group">
      <label htmlFor="notes" className="form-label">Notes</label>
      <textarea
        id="notes"
        value={candidateForm.notes}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, notes: e.target.value }))}
        className="input-field"
        rows={3}
        placeholder="Internal notes about the candidate..."
      />
    </div>

    <div className="flex gap-4 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-secondary flex-1"
      >
        Cancel
      </button>
      <button type="submit" className="btn btn-primary flex-1">
        {isEdit ? 'Update Candidate' : 'Add Candidate'}
      </button>
    </div>
  </form>
)

const CandidateManagement = () => {
  const { data: session } = useSession()
  const [candidates, setCandidates] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recruiterFilter, setRecruiterFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [expandedCandidates, setExpandedCandidates] = useState(new Set())
  const [permissions, setPermissions] = useState({})

  // Form state for adding/editing candidates
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: [],
    bio: '',
    source: '',
    notes: '',
    status: 'ACTIVE',
    addedById: '' // For admin to assign to specific recruiter
  })
  const [newSkill, setNewSkill] = useState('')

  const candidateStatuses = useMemo(() => [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800', description: 'Available for opportunities' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800', description: 'Successfully placed' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800', description: 'Not seeking opportunities' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800', description: 'Should not be contacted' }
  ], [])

  const isAdmin = session?.user?.recruiterProfile?.recruiterType === 'ADMIN'

  useEffect(() => {
    fetchCandidates()
    if (isAdmin) {
      fetchTeamMembers()
    }
  }, [isAdmin])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recruiter/candidates')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        setPermissions(data.permissions || {})
      } else {
        toast.error('Failed to fetch candidates')
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error('Failed to fetch candidates')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/recruiter/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.teamMembers || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleAddCandidate = useCallback(async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm)
      })

      if (response.ok) {
        toast.success('Candidate added successfully')
        setShowAddModal(false)
        resetForm()
        await fetchCandidates()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add candidate')
      }
    } catch (error) {
      console.error('Error adding candidate:', error)
      toast.error('Failed to add candidate')
    }
  }, [candidateForm])

  const handleUpdateCandidate = useCallback(async (e) => {
    e.preventDefault()
    if (!selectedCandidate) return

    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          ...candidateForm
        })
      })

      if (response.ok) {
        toast.success('Candidate updated successfully')
        setShowEditModal(false)
        setSelectedCandidate(null)
        resetForm()
        await fetchCandidates()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update candidate')
      }
    } catch (error) {
      console.error('Error updating candidate:', error)
      toast.error('Failed to update candidate')
    }
  }, [candidateForm, selectedCandidate])

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Candidate deleted successfully')
        await fetchCandidates()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete candidate')
      }
    } catch (error) {
      console.error('Error deleting candidate:', error)
      toast.error('Failed to delete candidate')
    }
  }

  const handleStatusUpdate = async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      })

      if (response.ok) {
        toast.success(`${candidateName}'s status updated to ${candidateStatuses.find(s => s.value === newStatus)?.label}`)
        await fetchCandidates()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleViewDetails = async (candidate) => {
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidate.id}`)
      if (response.ok) {
        const detailedCandidate = await response.json()
        setSelectedCandidate(detailedCandidate)
        setShowDetailModal(true)
      } else {
        toast.error('Failed to load candidate details')
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to load candidate details')
    }
  }

  const resetForm = useCallback(() => {
    setCandidateForm({
      name: '',
      email: '',
      phone: '',
      location: '',
      experience: '',
      skills: [],
      bio: '',
      source: '',
      notes: '',
      status: 'ACTIVE',
      addedById: ''
    })
    setNewSkill('')
  }, [])

  const addSkill = useCallback(() => {
    if (newSkill.trim() && !candidateForm.skills.includes(newSkill.trim())) {
      setCandidateForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }, [newSkill, candidateForm.skills])

  const removeSkill = useCallback((skillToRemove) => {
    setCandidateForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }, [])

  const openEditModal = useCallback((candidate) => {
    setSelectedCandidate(candidate)
    setCandidateForm({
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      location: candidate.location || '',
      experience: candidate.experience?.toString() || '',
      skills: candidate.skills || [],
      bio: candidate.bio || '',
      source: candidate.source || '',
      notes: candidate.notes || '',
      status: candidate.status || 'ACTIVE',
      addedById: candidate.addedById || ''
    })
    setShowEditModal(true)
  }, [])

  const handleAddModalCancel = useCallback(() => {
    setShowAddModal(false)
    resetForm()
  }, [resetForm])

  const handleEditModalCancel = useCallback(() => {
    setShowEditModal(false)
    setSelectedCandidate(null)
    resetForm()
  }, [resetForm])

  const toggleExpanded = (candidateId) => {
    setExpandedCandidates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => 
    candidates
      .filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
        const matchesRecruiter = recruiterFilter === 'all' || candidate.addedById === recruiterFilter

        return matchesSearch && matchesStatus && matchesRecruiter
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt)
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt)
          case 'name':
            return a.name.localeCompare(b.name)
          case 'status':
            return a.status.localeCompare(b.status)
          default:
            return 0
        }
      }), [candidates, searchTerm, statusFilter, recruiterFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'All Team Candidates' : 'Manage Candidates'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? `View and manage candidates from all team members (${filteredAndSortedCandidates.length} total)`
              : `Add, edit, and track your candidates (${filteredAndSortedCandidates.length} total)`
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            {candidateStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {isAdmin && (
            <select
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              className="input-field min-w-48"
            >
              <option value="all">All Recruiters</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner w-8 h-8 text-primary-600" />
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || recruiterFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Start by adding your first candidate'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && recruiterFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <UserPlus className="w-4 h-4" />
                Add First Candidate
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          candidateStatuses.find(s => s.value === candidate.status)?.color
                        }`}>
                          {candidate.status.replace('_', ' ')}
                        </span>
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
                    <button
                      onClick={() => handleViewDetails(candidate)}
                      className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(candidate)}
                      className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpanded(candidate.id)}
                      className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                    >
                      {expandedCandidates.has(candidate.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedCandidates.has(candidate.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>{candidate.resumes?.length || 0} resumes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{candidate.interviews?.length || 0} interviews</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span>{candidate.applications?.length || 0} applications</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                          {candidate.skills && candidate.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  +{candidate.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No skills listed</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <select
                              value={candidate.status}
                              onChange={(e) => handleStatusUpdate(candidate.id, e.target.value, candidate.name)}
                              className="input-field text-sm"
                            >
                              {candidateStatuses.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(candidate)}
                                className="btn btn-sm btn-primary flex-1"
                              >
                                View Details
                              </button>
                              {(isAdmin || candidate.addedById === session?.user?.id) && (
                                <button
                                  onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                                  className="btn btn-sm btn-secondary text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Candidate</h3>
            </div>
            <div className="p-6">
              <CandidateForm
                candidateForm={candidateForm}
                setCandidateForm={setCandidateForm}
                newSkill={newSkill}
                setNewSkill={setNewSkill}
                teamMembers={teamMembers}
                candidateStatuses={candidateStatuses}
                isAdmin={isAdmin}
                isEdit={false}
                onSubmit={handleAddCandidate}
                onCancel={handleAddModalCancel}
                addSkill={addSkill}
                removeSkill={removeSkill}
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit {selectedCandidate.name}</h3>
            </div>
            <div className="p-6">
              <CandidateForm
                candidateForm={candidateForm}
                setCandidateForm={setCandidateForm}
                newSkill={newSkill}
                setNewSkill={setNewSkill}
                teamMembers={teamMembers}
                candidateStatuses={candidateStatuses}
                isAdmin={isAdmin}
                isEdit={true}
                onSubmit={handleUpdateCandidate}
                onCancel={handleEditModalCancel}
                addSkill={addSkill}
                removeSkill={removeSkill}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Candidate Detail Modal */}
      {showDetailModal && selectedCandidate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false)
              setSelectedCandidate(null)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                  <p className="text-blue-100">{selectedCandidate.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedCandidate(null)
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Detailed candidate view content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedCandidate.email}</span>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedCandidate.phone}</span>
                      </div>
                    )}
                    {selectedCandidate.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedCandidate.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Professional Details</h4>
                  <div className="space-y-2">
                    {selectedCandidate.experience && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{selectedCandidate.experience} years experience</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Added by {selectedCandidate.addedBy?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedCandidate.bio || selectedCandidate.notes) && (
                <div className="mt-6 space-y-4">
                  {selectedCandidate.bio && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Bio</h4>
                      <p className="text-gray-600">{selectedCandidate.bio}</p>
                    </div>
                  )}
                  {selectedCandidate.notes && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Notes</h4>
                      <p className="text-gray-600">{selectedCandidate.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumes, Interviews, Applications sections can be added here */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default CandidateManagement