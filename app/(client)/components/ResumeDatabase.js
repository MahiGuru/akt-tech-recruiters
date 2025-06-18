'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Link2,
  Unlink,
  Star,
  Calendar,
  User,
  Mail,
  Phone,
  Briefcase,
  Tag,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Upload,
  CheckSquare,
  Square
} from 'lucide-react'
import toast from 'react-hot-toast'

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Keyboard shortcuts hook
const useKeyboardShortcuts = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault()
            callbacks.onSelectAll?.()
            break
          case 'Escape':
            e.preventDefault()
            callbacks.onClearSelection?.()
            break
          case 'e':
            e.preventDefault()
            callbacks.onExport?.()
            break
          case 'r':
            e.preventDefault()
            callbacks.onRefresh?.()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}

// Resume Preview Modal
const ResumePreviewModal = ({ resume, isOpen, onClose, onDownload }) => {
  if (!isOpen || !resume) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {resume.title || resume.originalName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(resume)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          {resume.url.endsWith('.pdf') ? (
            <iframe
              src={resume.url}
              className="w-full h-full border rounded"
              title="Resume Preview"
            />
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Preview not available for this file type</p>
              <button
                onClick={() => onDownload(resume)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download to View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Bulk Actions Modal
const BulkActionsModal = ({ 
  isOpen, 
  onClose, 
  selectedCount, 
  candidates, 
  onBulkMap, 
  onBulkDelete 
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [actionType, setActionType] = useState('')

  if (!isOpen) return null

  const handleAction = () => {
    if (actionType === 'map' && selectedCandidateId) {
      onBulkMap(selectedCandidateId)
    } else if (actionType === 'delete') {
      onBulkDelete()
    }
    onClose()
    setActionType('')
    setSelectedCandidateId('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Bulk Actions ({selectedCount} selected)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Choose Action:</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actionType"
                  value="map"
                  checked={actionType === 'map'}
                  onChange={(e) => setActionType(e.target.value)}
                  className="mr-2"
                />
                Map to Candidate
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="actionType"
                  value="delete"
                  checked={actionType === 'delete'}
                  onChange={(e) => setActionType(e.target.value)}
                  className="mr-2"
                />
                Delete Resumes
              </label>
            </div>
          </div>

          {actionType === 'map' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Candidate:</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Choose a candidate</option>
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} ({candidate.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'delete' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                ⚠️ This action cannot be undone. {selectedCount} resumes will be permanently deleted.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={actionType === 'map' && !selectedCandidateId}
            className={`flex-1 px-4 py-2 rounded text-white disabled:opacity-50 ${
              actionType === 'delete' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {actionType === 'map' ? 'Map Resumes' : 'Delete Resumes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function ResumeDatabase({ isAdmin = false, currentUserId, candidates = [] }) {
  const [resumes, setResumes] = useState([])
  const [filteredResumes, setFilteredResumes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recruiterFilter, setRecruiterFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedResumes, setSelectedResumes] = useState([])
  const [teamRecruiters, setTeamRecruiters] = useState([])
  const [previewResume, setPreviewResume] = useState(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const experienceLevels = [
    { value: 'ENTRY_LEVEL', label: 'Entry Level', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    { value: 'MID_LEVEL', label: 'Mid Level', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    { value: 'SENIOR_LEVEL', label: 'Senior Level', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    { value: 'EXECUTIVE', label: 'Executive', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    { value: 'FREELANCE', label: 'Freelance', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { value: 'INTERNSHIP', label: 'Internship', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  ]

  // Initialize data
  useEffect(() => {
    fetchResumes()
    if (isAdmin) {
      fetchTeamRecruiters()
    }
  }, [isAdmin])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [resumes, debouncedSearchTerm, experienceFilter, statusFilter, recruiterFilter, sortBy, sortOrder])

  const fetchResumes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let url = '/api/recruiter/resumes'
      const params = new URLSearchParams()
      
      if (recruiterFilter && isAdmin) {
        params.append('addedBy', recruiterFilter)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load resumes')
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      setError(error.message)
      toast.error('Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, recruiterFilter])

  const fetchTeamRecruiters = useCallback(async () => {
    try {
      const response = await fetch('/api/recruiter/team')
      if (response.ok) {
        const data = await response.json()
        setTeamRecruiters(data.teamMembers || [])
      }
    } catch (error) {
      console.error('Error fetching team recruiters:', error)
    }
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = [...resumes]

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(resume => {
        const ownerName = resume.userId ? resume.user?.name : resume.candidate?.name
        const ownerEmail = resume.userId ? resume.user?.email : resume.candidate?.email
        
        return (
          resume.title?.toLowerCase().includes(searchLower) ||
          resume.originalName?.toLowerCase().includes(searchLower) ||
          ownerName?.toLowerCase().includes(searchLower) ||
          ownerEmail?.toLowerCase().includes(searchLower) ||
          resume.description?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Experience level filter
    if (experienceFilter) {
      filtered = filtered.filter(resume => resume.experienceLevel === experienceFilter)
    }

    // Status filter
    if (statusFilter === 'mapped') {
      filtered = filtered.filter(resume => resume.candidateId)
    } else if (statusFilter === 'unmapped') {
      filtered = filtered.filter(resume => !resume.candidateId && resume.userId)
    }

    // Recruiter filter (for admin)
    if (recruiterFilter && isAdmin) {
      filtered = filtered.filter(resume => {
        if (resume.candidate) {
          return resume.candidate.addedById === recruiterFilter
        }
        return false
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'title':
          aValue = a.title || a.originalName || ''
          bValue = b.title || b.originalName || ''
          break
        case 'experienceLevel':
          aValue = a.experienceLevel
          bValue = b.experienceLevel
          break
        case 'fileSize':
          aValue = a.fileSize || 0
          bValue = b.fileSize || 0
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredResumes(filtered)
  }, [resumes, debouncedSearchTerm, experienceFilter, statusFilter, recruiterFilter, sortBy, sortOrder, isAdmin])

  // Action handlers
  const handleDeleteResume = useCallback(async (resume) => {
    if (!window.confirm(`Are you sure you want to delete "${resume.title || resume.originalName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recruiter/resumes/${resume.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Resume deleted successfully')
        setResumes(prev => prev.filter(r => r.id !== resume.id))
        setSelectedResumes(prev => prev.filter(id => id !== resume.id))
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete resume')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message)
    }
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedResumes.length === 0) return
    
    try {
      const deletePromises = selectedResumes.map(resumeId => 
        fetch(`/api/recruiter/resumes/${resumeId}`, { method: 'DELETE' })
      )
      
      const responses = await Promise.all(deletePromises)
      const successful = responses.filter(r => r.ok).length
      const failed = responses.length - successful

      if (successful > 0) {
        toast.success(`${successful} resumes deleted successfully`)
        setResumes(prev => prev.filter(r => !selectedResumes.includes(r.id)))
        setSelectedResumes([])
      }

      if (failed > 0) {
        toast.error(`${failed} resumes failed to delete`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Bulk delete operation failed')
    }
  }, [selectedResumes])

  const handleBulkMap = useCallback(async (candidateId) => {
    if (selectedResumes.length === 0 || !candidateId) return

    try {
      const operations = selectedResumes.map(resumeId => ({
        type: 'map',
        resumeId,
        candidateId
      }))

      const response = await fetch('/api/recruiter/resumes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.summary.successful} resumes mapped successfully`)
        await fetchResumes()
        setSelectedResumes([])
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Bulk mapping failed')
      }
    } catch (error) {
      console.error('Bulk mapping error:', error)
      toast.error(error.message)
    }
  }, [selectedResumes, fetchResumes])

  const handleViewResume = useCallback((resume) => {
    setPreviewResume(resume)
  }, [])

  const handleDownloadResume = useCallback((resume) => {
    const link = document.createElement('a')
    link.href = resume.url
    link.download = resume.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedResumes(filteredResumes.map(r => r.id))
  }, [filteredResumes])

  const handleClearSelection = useCallback(() => {
    setSelectedResumes([])
  }, [])

  const handleExport = useCallback(() => {
    if (filteredResumes.length === 0) {
      toast.error('No resumes to export')
      return
    }

    const csvHeaders = [
      'Title', 'Owner Name', 'Owner Email', 'Owner Type', 'Experience Level',
      'File Size', 'Upload Date', 'Status', 'Added By', 'Description'
    ]

    const csvData = filteredResumes.map(resume => {
      const ownerName = resume.userId ? resume.user?.name : resume.candidate?.name
      const ownerEmail = resume.userId ? resume.user?.email : resume.candidate?.email
      const ownerType = resume.userId ? 'User' : 'Candidate'
      const addedBy = resume.candidate?.addedBy?.name || 'N/A'
      const status = resume.candidateId ? 'Mapped' : 'Unmapped'
      const expLevel = experienceLevels.find(e => e.value === resume.experienceLevel)
      
      return [
        resume.title || resume.originalName,
        ownerName || 'N/A',
        ownerEmail || 'N/A',
        ownerType,
        expLevel?.label || resume.experienceLevel,
        formatFileSize(resume.fileSize),
        formatDate(resume.createdAt),
        status,
        addedBy,
        (resume.description || '').replace(/"/g, '""')
      ]
    })

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resume-database-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`Exported ${filteredResumes.length} resumes to CSV`)
  }, [filteredResumes, experienceLevels])

  const toggleResumeSelection = useCallback((resumeId) => {
    setSelectedResumes(prev => 
      prev.includes(resumeId) 
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    )
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,
    onExport: handleExport,
    onRefresh: fetchResumes
  })

  // Utility functions
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getExperienceLevel = (level) => {
    return experienceLevels.find(exp => exp.value === level) || 
           { label: level, bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  }

  // Statistics
  const statistics = useMemo(() => {
    const mappedResumes = resumes.filter(r => r.candidateId)
    const unmappedResumes = resumes.filter(r => !r.candidateId && r.userId)
    const userResumes = resumes.filter(r => r.userId)
    const candidateResumes = resumes.filter(r => r.candidateId)

    const experienceDistribution = experienceLevels.map(level => ({
      ...level,
      count: resumes.filter(r => r.experienceLevel === level.value).length
    }))

    return {
      total: resumes.length,
      mapped: mappedResumes.length,
      unmapped: unmappedResumes.length,
      userResumes: userResumes.length,
      candidateResumes: candidateResumes.length,
      experienceDistribution
    }
  }, [resumes, experienceLevels])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading resume database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Resumes</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchResumes}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume Database</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Manage all resumes across your team' 
              : 'Browse and manage accessible resumes'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchResumes}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {selectedResumes.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  {selectedResumes.length} selected
                </span>
                <button
                  onClick={handleClearSelection}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bulk Actions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
              <div className="text-sm text-gray-600">Total Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{statistics.mapped}</div>
              <div className="text-sm text-gray-600">Mapped</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Unlink className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">{statistics.unmapped}</div>
              <div className="text-sm text-gray-600">Unmapped</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{statistics.userResumes}</div>
              <div className="text-sm text-gray-600">User Resumes</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold text-indigo-600">{statistics.candidateResumes}</div>
              <div className="text-sm text-gray-600">Candidate Resumes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        {/* Basic Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, name, email, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Resumes</option>
            <option value="mapped">Mapped to Candidates</option>
            <option value="unmapped">Unmapped User Resumes</option>
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Experience Levels</option>
            {experienceLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isAdmin && (
                  <select
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Team Members</option>
                    {teamRecruiters.map(recruiter => (
                      <option key={recruiter.userId} value={recruiter.userId}>
                        {recruiter.user.name} ({recruiter.recruiterType})
                      </option>
                    ))}
                  </select>
                )}
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Sort by Upload Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="experienceLevel">Sort by Experience Level</option>
                  <option value="fileSize">Sort by File Size</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resume List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <button
                onClick={selectedResumes.length === filteredResumes.length ? handleClearSelection : handleSelectAll}
                className="p-1 hover:bg-gray-100 rounded"
                title={selectedResumes.length === filteredResumes.length ? "Deselect all" : "Select all"}
              >
                {selectedResumes.length === filteredResumes.length ? 
                  <CheckSquare className="w-4 h-4 text-blue-600" /> : 
                  <Square className="w-4 h-4 text-gray-400" />
                }
              </button>
              Resumes ({filteredResumes.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {filteredResumes.length} of {resumes.length} resumes
            </div>
          </div>
        </div>

        {filteredResumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h4>
            <p className="text-gray-600">
              {searchTerm || experienceFilter || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more results'
                : 'No resumes have been uploaded yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResumes.map((resume, index) => {
              const ownerName = resume.userId ? resume.user?.name : resume.candidate?.name
              const ownerEmail = resume.userId ? resume.user?.email : resume.candidate?.email
              const ownerPhone = resume.userId ? resume.user?.phone : resume.candidate?.phone
              const ownerType = resume.userId ? 'User' : 'Candidate'
              const recruiterInfo = resume.candidate?.addedBy
              const expLevel = getExperienceLevel(resume.experienceLevel)

              return (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedResumes.includes(resume.id)}
                        onChange={() => toggleResumeSelection(resume.id)}
                        className="mt-1"
                      />

                      {/* Resume Icon */}
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>

                      {/* Resume Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {resume.title || resume.originalName}
                          </h4>
                          {resume.isPrimary && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                          {resume.candidateId ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Link2 className="w-3 h-3 mr-1" />
                              Mapped
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Unlink className="w-3 h-3 mr-1" />
                              Unmapped
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          {/* Owner Information */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium">{ownerName}</span>
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {ownerType}
                              </span>
                            </div>
                            {ownerEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{ownerEmail}</span>
                              </div>
                            )}
                            {ownerPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{ownerPhone}</span>
                              </div>
                            )}
                          </div>

                          {/* Resume Information */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${expLevel.bgColor} ${expLevel.textColor}`}>
                                {expLevel.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Uploaded {formatDate(resume.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{formatFileSize(resume.fileSize)}</span>
                            </div>
                          </div>

                          {/* Recruiter Information (for candidate resumes) */}
                          {resume.candidate && recruiterInfo && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span className="font-medium">Added by:</span>
                              </div>
                              <div className="text-xs">
                                <div>{recruiterInfo.name}</div>
                                <div className="text-gray-500">{recruiterInfo.email}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {resume.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {resume.description.length > 100 
                              ? `${resume.description.substring(0, 100)}...`
                              : resume.description
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleViewResume(resume)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View resume"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadResume(resume)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download resume"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {resume.canEdit && (
                        <button
                          className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit resume"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {resume.canDelete && (
                        <button
                          onClick={() => handleDeleteResume(resume)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Experience Distribution */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-4">Experience Level Distribution</h3>
        <div className="space-y-3">
          {statistics.experienceDistribution.map((level, index) => {
            const percentage = statistics.total > 0 ? (level.count / statistics.total) * 100 : 0
            
            return (
              <motion.div
                key={level.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {level.label}
                  </span>
                  <span className="text-sm text-gray-600">
                    {level.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-2 rounded-full bg-blue-500"
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Resume Preview Modal */}
      <ResumePreviewModal
        resume={previewResume}
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        onDownload={handleDownloadResume}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedCount={selectedResumes.length}
        candidates={candidates}
        onBulkMap={handleBulkMap}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  )
}