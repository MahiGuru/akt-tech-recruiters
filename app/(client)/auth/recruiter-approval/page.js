// app/(client)/auth/recruiter-approval/page.js
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  UserCheck, 
  Users, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Building,
  User,
  Mail
} from 'lucide-react'
import Image from 'next/image'

const recruiterTypeOptions = [
  { value: 'ADMIN', label: 'Admin Recruiter', description: 'Full access and team management', icon: '🛡️' },
  { value: 'TA', label: 'Technical Analyst', description: 'Technical screening and assessment', icon: '🔍' },
  { value: 'HR', label: 'Human Resources', description: 'HR processes and compliance', icon: '👥' },
  { value: 'CS', label: 'Customer Success', description: 'Client relationship management', icon: '🤝' },
  { value: 'LEAD', label: 'Lead Recruiter', description: 'Team leadership and strategy', icon: '🎯' },
  { value: 'JUNIOR', label: 'Junior Recruiter', description: 'Entry-level recruiting role', icon: '⭐' }
]

export default function RecruiterApprovalRequest() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [admins, setAdmins] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState('')
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      recruiterType: 'ADMIN', // Default to admin for first-time setup
      department: '',
      message: ''
    }
  })

  const selectedType = watch('recruiterType')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'RECRUITER') {
      router.push('/dashboard/employee')
      return
    }

    // Check if user already has active access
    checkExistingAccess()
    fetchAdmins()
  }, [session, status, router])

  const checkExistingAccess = async () => {
    try {
      const response = await fetch('/api/recruiter/profile/status')
      if (response.ok) {
        const data = await response.json()
        if (data.isActive) {
          router.push('/dashboard/recruiter')
        } else if (data.hasPendingRequest) {
          setRequestSubmitted(true)
        }
      }
    } catch (error) {
      console.error('Error checking access status:', error)
    }
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/recruiter/team/request')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/recruiter/team/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          adminId: selectedAdmin || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.isActive) {
          // Immediate access granted (admin role)
          toast.success('🎉 Admin access granted! Redirecting to dashboard...')
          setTimeout(() => {
            router.push('/dashboard/recruiter')
          }, 1500)
        } else {
          // Needs approval
          toast.success('Access request submitted successfully!')
          setRequestSubmitted(true)
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Request Submitted!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your request to join the recruiting team has been submitted successfully. 
              You will receive a notification once an admin reviews your request.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• An admin will review your request</li>
                <li>• You&apos;ll receive an email notification</li>
                <li>• Once approved, you can access the dashboard</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/auth/login')}
              className="btn btn-secondary w-full"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="At Bench Logo" width={200} height={80} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Request Recruiter Access
          </h1>
          <p className="text-gray-600">
            Complete your profile to request access to the recruiting dashboard
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-8">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{session.user.name}</h3>
                <p className="text-sm text-gray-600">{session.user.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div className="form-group">
              <label className="form-label required">
                What type of recruiter role are you applying for?
              </label>
              <div className="grid grid-cols-1 gap-3">
                {recruiterTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedType === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('recruiterType', { required: 'Please select a role' })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      {selectedType === option.value && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.recruiterType && (
                <p className="text-red-600 text-sm mt-1">{errors.recruiterType.message}</p>
              )}
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label">Department (Optional)</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  {...register('department')}
                  className="input-field"
                  placeholder="e.g., Engineering, Sales, Marketing"
                />
                <Building className="input-icon" />
              </div>
            </div>

            {/* Admin Selection */}
            <div className="form-group">
              <label className="form-label">
                Select an Admin (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Choose a specific admin to review your request, or leave blank to send to all admins.
              </p>
              
              {admins.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No admin recruiters found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value=""
                      checked={selectedAdmin === ''}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Any Available Admin</p>
                        <p className="text-sm text-gray-600">Send to all admins</p>
                      </div>
                    </div>
                  </label>

                  {admins.map((admin) => (
                    <label
                      key={admin.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        value={admin.userId}
                        checked={selectedAdmin === admin.userId}
                        onChange={(e) => setSelectedAdmin(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          {admin.user.image ? (
                            <img 
                              src={admin.user.image} 
                              alt={admin.user.name} 
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Shield className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.user.name}</p>
                          <p className="text-sm text-gray-600">{admin.user.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Message to Admin (Optional)</label>
              <textarea
                {...register('message')}
                className="input-field"
                rows={3}
                placeholder="Tell the admin why you want to join the recruiting team..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-5 h-5" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Access Request
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact your system administrator or{' '}
              <a href="mailto:support@atbench.com" className="text-blue-600 hover:text-blue-700">
                support@atbench.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}