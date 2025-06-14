'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  FileText,
  ArrowRight,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Eye,
  Download,
  Star,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumeMappingManager({ candidates = [], onMappingUpdate }) {
  const [resumes, setResumes] = useState([])
  const [mappedResumes, setMappedResumes] = useState([])
  const [unmappedResumes, setUnmappedResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [pendingMapping, setPendingMapping] = useState(null)
  const [bulkMappingMode, setBulkMappingMode] = useState(false)
  const [selectedResumes, setSelectedResumes] = useState([])

  useEffect(() => {
    fetchResumes()
  }, [])

  useEffect(() => {
    categorizeResumes()
  }, [resumes])

  const fetchResumes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/recruiter/resumes')
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      } else {
        toast.error('Failed to load resumes')
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  const categorizeResumes = () => {
    const mapped = resumes.filter(resume => resume.candidateId)
    const unmapped = resumes.filter(resume => !resume.candidateId && resume.userId)
    
    setMappedResumes(mapped)
    setUnmappedResumes(unmapped)
  }

  const mapResumeToCandidate = async (resumeId, candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/resumes/${resumeId}/map`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Resume mapped to candidate successfully')
        await fetchResumes()
        onMappingUpdate?.(result)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to map resume')
      }
    } catch (error) {
      console.error('Mapping error:', error)
      toast.error(error.message)
    }
  }

  const unmapResume = async (resumeId) => {
    try {
      const response = await fetch(`/api/recruiter/resumes/${resumeId}/unmap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('Resume unmapped from candidate')
        await fetchResumes()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to unmap resume')
      }
    } catch (error) {
      console.error('Unmapping error:', error)
      toast.error(error.message)
    }
  }

  const handleBulkMapping = async () => {
    if (selectedResumes.length === 0 || !selectedCandidate) {
      toast.error('Please select resumes and a candidate')
      return
    }

    try {
      const mappingPromises = selectedResumes.map(resumeId => 
        mapResumeToCandidate(resumeId, selectedCandidate)
      )
      
      await Promise.all(mappingPromises)
      toast.success(`Mapped ${selectedResumes.length} resumes to candidate`)
      setSelectedResumes([])
      setBulkMappingMode(false)
      setSelectedCandidate('')
    } catch (error) {
      toast.error('Bulk mapping failed')
    }
  }

  const suggestCandidateForResume = (resume) => {
    if (!resume.user) return null
    
    // Try to match by name or email
    return candidates.find(candidate => 
      candidate.name.toLowerCase().includes(resume.user.name.toLowerCase()) ||
      resume.user.name.toLowerCase().includes(candidate.name.toLowerCase()) ||
      candidate.email.toLowerCase() === resume.user.email.toLowerCase()
    )
  }

  const filteredUnmappedResumes = unmappedResumes.filter(resume => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      resume.title?.toLowerCase().includes(searchLower) ||
      resume.user?.name?.toLowerCase().includes(searchLower) ||
      resume.user?.email?.toLowerCase().includes(searchLower) ||
      resume.originalName?.toLowerCase().includes(searchLower)
    )
  })

  const filteredMappedResumes = mappedResumes.filter(resume => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      resume.title?.toLowerCase().includes(searchLower) ||
      resume.candidate?.name?.toLowerCase().includes(searchLower) ||
      resume.candidate?.email?.toLowerCase().includes(searchLower) ||
      resume.originalName?.toLowerCase().includes(searchLower)
    )
  })

  const getExperienceColor = (level) => {
    const colors = {
      'ENTRY_LEVEL': 'bg-green-100 text-green-800',
      'MID_LEVEL': 'bg-blue-100 text-blue-800',
      'SENIOR_LEVEL': 'bg-purple-100 text-purple-800',
      'EXECUTIVE': 'bg-red-100 text-red-800',
      'FREELANCE': 'bg-yellow-100 text-yellow-800',
      'INTERNSHIP': 'bg-gray-100 text-gray-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getExperienceLabel = (level) => {
    return level?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || level
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading resume mappings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Resume Mapping Manager</h3>
          <p className="text-sm text-gray-600">
            Map user resumes to candidates and manage existing mappings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkMappingMode(!bulkMappingMode)}
            className={`btn btn-sm ${bulkMappingMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {bulkMappingMode ? 'Exit Bulk Mode' : 'Bulk Mapping'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{resumes.length}</div>
              <div className="text-sm text-gray-600">Total Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{mappedResumes.length}</div>
              <div className="text-sm text-gray-600">Mapped</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Unlink className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">{unmappedResumes.length}</div>
              <div className="text-sm text-gray-600">Unmapped</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{candidates.length}</div>
              <div className="text-sm text-gray-600">Candidates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resumes by title, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {bulkMappingMode && (
            <>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="input-field"
              >
                <option value="">Select candidate for bulk mapping</option>
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} ({candidate.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkMapping}
                disabled={selectedResumes.length === 0 || !selectedCandidate}
                className="btn btn-primary"
              >
                Map {selectedResumes.length} Selected
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unmapped Resumes */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold flex items-center gap-2">
              <Unlink className="w-4 h-4 text-orange-600" />
              Unmapped Resumes ({filteredUnmappedResumes.length})
            </h4>
            <p className="text-sm text-gray-600">User resumes not yet mapped to candidates</p>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredUnmappedResumes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No unmapped resumes</p>
              </div>
            ) : (
              filteredUnmappedResumes.map((resume, index) => {
                const suggestedCandidate = suggestCandidateForResume(resume)
                
                return (
                  <motion.div
                    key={resume.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {bulkMappingMode && (
                          <div className="mb-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedResumes.includes(resume.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedResumes(prev => [...prev, resume.id])
                                  } else {
                                    setSelectedResumes(prev => prev.filter(id => id !== resume.id))
                                  }
                                }}
                              />
                              <span className="text-sm">Select for bulk mapping</span>
                            </label>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-gray-900">{resume.title}</h5>
                          {resume.isPrimary && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {resume.user?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {resume.user?.email}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(resume.experienceLevel)}`}>
                              {getExperienceLabel(resume.experienceLevel)}
                            </span>
                            <span className="text-xs">{formatFileSize(resume.fileSize)}</span>
                          </div>
                        </div>

                        {suggestedCandidate && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <div className="flex items-center gap-1 text-blue-700">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">Suggested match:</span>
                            </div>
                            <div className="text-blue-600">{suggestedCandidate.name}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        {suggestedCandidate && (
                          <button
                            onClick={() => mapResumeToCandidate(resume.id, suggestedCandidate.id)}
                            className="btn btn-ghost btn-sm text-green-600 hover:text-green-700"
                            title="Quick map to suggested candidate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPendingMapping(resume)
                            setShowMappingModal(true)
                          }}
                          className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                          title="Map to candidate"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(resume.url, '_blank')}
                          className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                          title="View resume"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* Mapped Resumes */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-green-600" />
              Mapped Resumes ({filteredMappedResumes.length})
            </h4>
            <p className="text-sm text-gray-600">Resumes successfully mapped to candidates</p>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredMappedResumes.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No mapped resumes</p>
              </div>
            ) : (
              filteredMappedResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-green-50 border-green-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-gray-900">{resume.title}</h5>
                        {resume.isPrimary && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{resume.candidate?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {resume.candidate?.email}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(resume.experienceLevel)}`}>
                            {getExperienceLabel(resume.experienceLevel)}
                          </span>
                          <span className="text-xs">{formatFileSize(resume.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => unmapResume(resume.id)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        title="Unmap from candidate"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(resume.url, '_blank')}
                        className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                        title="View resume"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mapping Modal */}
      <AnimatePresence>
        {showMappingModal && pendingMapping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Map Resume to Candidate</h3>
                <button
                  onClick={() => {
                    setShowMappingModal(false)
                    setPendingMapping(null)
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Resume Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resume to Map:</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Title:</strong> {pendingMapping.title}</p>
                    <p><strong>Original Owner:</strong> {pendingMapping.user?.name} ({pendingMapping.user?.email})</p>
                    <p><strong>Experience Level:</strong> {getExperienceLabel(pendingMapping.experienceLevel)}</p>
                  </div>
                </div>

                {/* Candidate Selection */}
                <div>
                  <label className="form-label">Select Candidate</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                    {candidates.map(candidate => (
                      <label
                        key={candidate.id}
                        className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="selectedCandidate"
                          value={candidate.id}
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                          {candidate.phone && (
                            <p className="text-sm text-gray-500">{candidate.phone}</p>
                          )}
                          {candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{candidate.skills.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowMappingModal(false)
                      setPendingMapping(null)
                      setSelectedCandidate('')
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedCandidate) {
                        await mapResumeToCandidate(pendingMapping.id, selectedCandidate)
                        setShowMappingModal(false)
                        setPendingMapping(null)
                        setSelectedCandidate('')
                      }
                    }}
                    disabled={!selectedCandidate}
                    className="btn btn-primary flex-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Map Resume
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}