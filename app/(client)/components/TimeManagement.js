// app/(client)/components/TimeManagement.js
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Edit, 
  Save,
  ChevronDown,
  Users,
  Timer,
  CheckCircle,
  AlertCircle,
  Eye,
  Crown
} from 'lucide-react'
import toast from 'react-hot-toast'

const TimeManagement = ({ user, isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState('my-time')
  const [timeEntries, setTimeEntries] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek())
  const [viewMode, setViewMode] = useState('week') // week, month
  const [userProfile, setUserProfile] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    project: ''
  })

  // Bulk form state
  const [bulkFormData, setBulkFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    project: '',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] // exclude weekends by default
  })

  useEffect(() => {
    fetchUserProfile()
    fetchTimeEntries()
    if (isAdmin) {
      fetchPendingApprovals()
    }
  }, [selectedWeek, viewMode])

  // Set default tab based on user type
  useEffect(() => {
    if (userProfile) {
      const isMainAdmin = userProfile.recruiterType === 'ADMIN' && !userProfile.adminId
      if (isMainAdmin) {
        setActiveTab('approvals')
      }
    }
  }, [userProfile])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/recruiter/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Check if user is main admin (cannot log time)
  const isMainAdmin = userProfile?.recruiterType === 'ADMIN' && !userProfile?.adminId

  const handleSubmitBulkEntry = async (e) => {
    e.preventDefault()
    
    if (!bulkFormData.hours || parseFloat(bulkFormData.hours) <= 0) {
      toast.error('Please enter valid hours')
      return
    }

    if (!bulkFormData.startDate || !bulkFormData.endDate) {
      toast.error('Please select start and end dates')
      return
    }

    const startDate = new Date(bulkFormData.startDate)
    const endDate = new Date(bulkFormData.endDate)

    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }

    // Generate entries for selected work days
    const entries = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      
      if (bulkFormData.workDays.includes(dayName)) {
        entries.push({
          date: currentDate.toISOString().split('T')[0],
          hours: bulkFormData.hours,
          description: bulkFormData.description,
          project: bulkFormData.project
        })
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (entries.length === 0) {
      toast.error('No valid work days selected in the date range')
      return
    }

    try {
      const response = await fetch('/api/recruiter/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.created} time entries created successfully`)
        
        if (data.errors && data.errors.length > 0) {
          toast.error(`${data.errors.length} entries had errors`)
          console.log('Bulk entry errors:', data.errors)
        }
        
        setShowBulkForm(false)
        setBulkFormData({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          hours: '',
          description: '',
          project: '',
          workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        })
        
        fetchTimeEntries()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create bulk entries')
      }
    } catch (error) {
      console.error('Error creating bulk entries:', error)
      toast.error('Something went wrong')
    }
  }

  useEffect(() => {
    fetchTimeEntries()
    if (isAdmin) {
      fetchPendingApprovals()
    }
  }, [selectedWeek, viewMode])

  const fetchTimeEntries = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        viewMode,
        startDate: selectedWeek.start.toISOString(),
        endDate: selectedWeek.end.toISOString()
      })
      
      const response = await fetch(`/api/recruiter/time-entries?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
      toast.error('Failed to load time entries')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/recruiter/time-entries/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingApprovals(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    }
  }

  const handleSubmitEntry = async (e) => {
    e.preventDefault()
    
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      toast.error('Please enter valid hours')
      return
    }

    try {
      const method = editingEntry ? 'PUT' : 'POST'
      const url = editingEntry 
        ? `/api/recruiter/time-entries/${editingEntry.id}`
        : '/api/recruiter/time-entries'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(editingEntry ? 'Time entry updated' : 'Time entry submitted')
        
        setShowAddForm(false)
        setEditingEntry(null)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          hours: '',
          description: '',
          project: ''
        })
        
        fetchTimeEntries()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save time entry')
      }
    } catch (error) {
      console.error('Error saving time entry:', error)
      toast.error('Something went wrong')
    }
  }

  const handleApproveReject = async (entryId, status, comments = '') => {
    try {
      const response = await fetch(`/api/recruiter/time-entries/${entryId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments })
      })

      if (response.ok) {
        toast.success(`Time entry ${status.toLowerCase()}`)
        fetchPendingApprovals()
      } else {
        toast.error('Failed to update time entry')
      }
    } catch (error) {
      console.error('Error updating time entry:', error)
      toast.error('Something went wrong')
    }
  }

  const weeklyStats = useMemo(() => {
    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= selectedWeek.start && entryDate <= selectedWeek.end
    })

    const totalHours = weekEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.hours || 0), 0
    )
    
    const approvedHours = weekEntries
      .filter(entry => entry.status === 'APPROVED')
      .reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0)
    
    const pendingHours = weekEntries
      .filter(entry => entry.status === 'PENDING')
      .reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0)

    return { totalHours, approvedHours, pendingHours, entryCount: weekEntries.length }
  }, [timeEntries, selectedWeek])

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <X className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'DRAFT': return <Edit className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Time Management</h2>
          <p className="text-gray-600">
            {isMainAdmin 
              ? "Approve time entries for your team members" 
              : "Track and manage work hours"
            }
          </p>
        </div>
        
        {activeTab === 'my-time' && !isMainAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkForm(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Bulk Entry
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Time
            </button>
          </div>
        )}
        
        {isMainAdmin && (
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Crown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-medium">Main Administrator</p>
              <p className="text-blue-600 text-sm">You can only approve team member time entries</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {!isMainAdmin && (
            <button
              onClick={() => setActiveTab('my-time')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-time'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                My Time
              </div>
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Approvals
                {pendingApprovals.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* My Time Tab */}
      {activeTab === 'my-time' && (
        <div className="space-y-6">
          {/* Week/Month Selector */}
          <div className="flex items-center justify-between bg-white rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'week' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'month' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Month
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWeek(getPreviousWeek(selectedWeek))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                
                <span className="font-medium text-gray-900">
                  {formatWeekRange(selectedWeek)}
                </span>
                
                <button
                  onClick={() => setSelectedWeek(getNextWeek(selectedWeek))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg text-blue-600">
                  {weeklyStats.totalHours.toFixed(1)}h
                </div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">
                  {weeklyStats.approvedHours.toFixed(1)}h
                </div>
                <div className="text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-yellow-600">
                  {weeklyStats.pendingHours.toFixed(1)}h
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
            </div>
          </div>

          {/* Time Entries List */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Time Entries</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {timeEntries.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No time entries</h4>
                  <p className="text-gray-600 mb-4">Start tracking your work hours</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-primary"
                  >
                    Log Your First Entry
                  </button>
                </div>
              ) : (
                timeEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {new Date(entry.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            {parseFloat(entry.hours).toFixed(1)}h
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {getStatusIcon(entry.status)}
                            {entry.status}
                          </span>
                        </div>
                        
                        {entry.project && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Project:</strong> {entry.project}
                          </div>
                        )}
                        
                        {entry.description && (
                          <div className="text-sm text-gray-600">
                            {entry.description}
                          </div>
                        )}
                        
                        {entry.reviewComments && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Manager's Comments:</strong> {entry.reviewComments}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {entry.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              setEditingEntry(entry)
                              setFormData({
                                date: entry.date.split('T')[0],
                                hours: entry.hours,
                                description: entry.description || '',
                                project: entry.project || ''
                              })
                              setShowAddForm(true)
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h4>
                  <p className="text-gray-600">No pending time entries to review</p>
                </div>
              ) : (
                pendingApprovals.map((entry) => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">
                            {entry.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span className="text-xl font-bold text-blue-600">
                            {parseFloat(entry.hours).toFixed(1)}h
                          </span>
                        </div>
                        
                        {entry.project && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Project:</strong> {entry.project}
                          </div>
                        )}
                        
                        {entry.description && (
                          <div className="text-sm text-gray-600 mb-3">
                            {entry.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveReject(entry.id, 'APPROVED')}
                          className="btn btn-success btn-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const comments = prompt('Rejection reason (optional):')
                            handleApproveReject(entry.id, 'REJECTED', comments || '')
                          }}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <form onSubmit={handleSubmitEntry}>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    {editingEntry ? 'Edit Time Entry' : 'Log Time Entry'}
                  </h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={formData.hours}
                      onChange={(e) => setFormData({...formData, hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8.0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) => setFormData({...formData, project: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Project name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="What did you work on?"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingEntry(null)
                      setFormData({
                        date: new Date().toISOString().split('T')[0],
                        hours: '',
                        description: '',
                        project: ''
                      })
                    }}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingEntry ? 'Update' : 'Submit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Entry Form Modal */}
      <AnimatePresence>
        {showBulkForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowBulkForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            >
              <form onSubmit={handleSubmitBulkEntry}>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Bulk Time Entry</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Log the same hours for multiple days at once
                  </p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={bulkFormData.startDate}
                        onChange={(e) => setBulkFormData({...bulkFormData, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={bulkFormData.endDate}
                        onChange={(e) => setBulkFormData({...bulkFormData, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours per Day *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={bulkFormData.hours}
                      onChange={(e) => setBulkFormData({...bulkFormData, hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8.0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Days
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'monday', label: 'Monday' },
                        { key: 'tuesday', label: 'Tuesday' },
                        { key: 'wednesday', label: 'Wednesday' },
                        { key: 'thursday', label: 'Thursday' },
                        { key: 'friday', label: 'Friday' },
                        { key: 'saturday', label: 'Saturday' },
                        { key: 'sunday', label: 'Sunday' }
                      ].map(day => (
                        <label key={day.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={bulkFormData.workDays.includes(day.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkFormData({
                                  ...bulkFormData,
                                  workDays: [...bulkFormData.workDays, day.key]
                                })
                              } else {
                                setBulkFormData({
                                  ...bulkFormData,
                                  workDays: bulkFormData.workDays.filter(d => d !== day.key)
                                })
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <input
                      type="text"
                      value={bulkFormData.project}
                      onChange={(e) => setBulkFormData({...bulkFormData, project: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Project name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={bulkFormData.description}
                      onChange={(e) => setBulkFormData({...bulkFormData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="What did you work on?"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkForm(false)
                      setBulkFormData({
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        hours: '',
                        description: '',
                        project: '',
                        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                      })
                    }}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Create Entries
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper functions
function getCurrentWeek() {
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
  startOfWeek.setHours(0, 0, 0, 0)
  endOfWeek.setHours(23, 59, 59, 999)
  return { start: startOfWeek, end: endOfWeek }
}

function getPreviousWeek(currentWeek) {
  const start = new Date(currentWeek.start)
  const end = new Date(currentWeek.end)
  start.setDate(start.getDate() - 7)
  end.setDate(end.getDate() - 7)
  return { start, end }
}

function getNextWeek(currentWeek) {
  const start = new Date(currentWeek.start)
  const end = new Date(currentWeek.end)
  start.setDate(start.getDate() + 7)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

function formatWeekRange(week) {
  const options = { month: 'short', day: 'numeric' }
  const start = week.start.toLocaleDateString('en-US', options)
  const end = week.end.toLocaleDateString('en-US', options)
  return `${start} - ${end}`
}

export default TimeManagement