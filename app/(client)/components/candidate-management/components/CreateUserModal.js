// app/(client)/components/candidate-management/components/CreateUserModal.js
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, User, Mail, Lock, UserCheck, Building, Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateUserModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  onUserCreated 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: candidate?.email || '',
    password: '',
    confirmPassword: '',
    userType: 'RECRUITER',
    workType: 'CONSULTANT',
    department: ''
  })
  const [errors, setErrors] = useState({})

  const userTypes = [
    { 
      value: 'RECRUITER', 
      label: 'Recruiter', 
      icon: UserCheck, 
      description: 'Can manage candidates and team' 
    },
    { 
      value: 'EMPLOYER', 
      label: 'Employer', 
      icon: Building, 
      description: 'Can post jobs and manage applications' 
    }
  ]

  const workTypes = [
    { 
      value: 'CONSULTANT', 
      label: 'Consultant', 
      icon: User, 
      description: 'Independent consulting work' 
    },
    { 
      value: 'PART_TIME_EMPLOYEE', 
      label: 'Part-Time Employee', 
      icon: Users, 
      description: 'Part-time employment arrangement' 
    },
    { 
      value: 'FULL_TIME_EMPLOYEE', 
      label: 'Full Time Employee', 
      icon: UserCheck, 
      description: 'Full-time employment arrangement' 
    },
    { 
      value: 'FREELANCER', 
      label: 'Freelancer', 
      icon: User, 
      description: 'Freelance project work' 
    },
    { 
      value: 'REMOTE_WORKING', 
      label: 'Remote Working', 
      icon: Shield, 
      description: 'Remote work arrangement' 
    }
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.userType) {
      newErrors.userType = 'User type is required'
    }

    if (!formData.workType) {
      newErrors.workType = 'Work type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/recruiter/candidates/${candidate.id}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.userType, // Map userType to role for API
          workType: formData.workType,
          department: formData.department || undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`User account created successfully for ${candidate.name}!`)
        onUserCreated(result)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create user account')
      }
    } catch (error) {
      console.error('Error creating user account:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen || !candidate) return null

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">Create User Account</h3>
              <p className="text-green-100">Convert {candidate.name} to team member</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Candidate Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{candidate.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Current Email:</span>
                  <span className="ml-2 font-medium">{candidate.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {candidate.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <span className="ml-2 font-medium">{candidate.experience || 'N/A'} years</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="user@company.com"
                  required
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engineering, Sales"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                  required
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select User Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleFieldChange('userType', type.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.userType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${
                          formData.userType === type.value ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  )
                })}
              </div>
              {errors.userType && (
                <p className="text-red-600 text-sm mt-1">{errors.userType}</p>
              )}
            </div>

            {/* Work Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Work Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleFieldChange('workType', type.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.workType === type.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${
                          formData.workType === type.value ? 'text-green-600' : 'text-gray-600'
                        }`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </button>
                  )
                })}
              </div>
              {errors.workType && (
                <p className="text-red-600 text-sm mt-1">{errors.workType}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Create User Account
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

export default CreateUserModal