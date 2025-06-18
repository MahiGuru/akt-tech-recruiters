// app/(client)/components/candidate-management/components/InterviewSchedulingModal.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const InterviewSchedulingModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  onScheduleSuccess, 
  editingInterview = null 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    meetingLink: '',
    notes: ''
  })

  // Reset form when modal opens/closes or when editing interview changes
  useEffect(() => {
    if (isOpen) {
      if (editingInterview) {
        // Populate form with existing interview data
        setInterviewForm({
          title: editingInterview.title || '',
          description: editingInterview.description || '',
          scheduledAt: editingInterview.scheduledAt 
            ? new Date(editingInterview.scheduledAt).toISOString().slice(0, 16) 
            : '',
          duration: editingInterview.duration || 60,
          meetingLink: editingInterview.meetingLink || '',
          notes: editingInterview.notes || ''
        })
      } else {
        // Reset for new interview
        setInterviewForm({
          title: '',
          description: '',
          scheduledAt: '',
          duration: 60,
          meetingLink: '',
          notes: ''
        })
      }
    }
  }, [isOpen, editingInterview])

  const handleSubmitInterview = async (e) => {
    e.preventDefault()
    
    if (!interviewForm.title || !interviewForm.scheduledAt) {
      toast.error('Title and scheduled time are required')
      return
    }

    try {
      setIsSubmitting(true)
      
      const url = '/api/recruiter/interviews'
      const method = editingInterview ? 'PUT' : 'POST'
      
      const payload = editingInterview 
        ? { interviewId: editingInterview.id, ...interviewForm }
        : { candidateId: candidate.id, ...interviewForm }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(editingInterview ? 'Interview updated successfully!' : 'Interview scheduled successfully!')
        onScheduleSuccess(data.interview)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to ${editingInterview ? 'update' : 'schedule'} interview`)
      }
    } catch (error) {
      console.error(`Error ${editingInterview ? 'updating' : 'scheduling'} interview:`, error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">
                {editingInterview ? 'Reschedule Interview' : 'Schedule Interview'}
              </h3>
              <p className="text-blue-100">
                {editingInterview 
                  ? `Updating "${editingInterview.title}"` 
                  : `with ${candidate?.name}`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmitInterview} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Title *
                </label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technical Interview, HR Round"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={interviewForm.duration}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={interviewForm.description}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Interview details, topics to cover, etc."
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Internal notes about the interview"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingInterview ? 'Updating...' : 'Scheduling...'}
                  </div>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default InterviewSchedulingModal