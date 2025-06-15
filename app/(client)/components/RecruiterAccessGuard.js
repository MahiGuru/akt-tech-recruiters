// app/(client)/components/RecruiterAccessGuard.js
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, AlertCircle, Shield, CheckCircle, RefreshCw } from 'lucide-react'

const RecruiterAccessGuard = ({ children }) => {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [accessStatus, setAccessStatus] = useState(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role === 'RECRUITER') {
      checkRecruiterAccess()
    } else {
      setAccessStatus('not_recruiter')
      setIsChecking(false)
    }
  }, [session, status, router])

  const checkRecruiterAccess = async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/recruiter/profile/status')
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.isActive) {
          setAccessStatus('active')
          // Update session if needed
          if (!session.user.recruiterProfile?.isActive) {
            await update()
          }
        } else if (data.hasPendingRequest) {
          setAccessStatus('pending')
        } else if (!data.hasProfile) {
          setAccessStatus('needs_setup')
          router.push('/auth/recruiter-approval')
          return
        } else {
          // Has profile but not active and no pending request - something went wrong
          setAccessStatus('error')
        }
      } else {
        setAccessStatus('error')
      }
    } catch (error) {
      console.error('Error checking recruiter access:', error)
      setAccessStatus('error')
    } finally {
      setIsChecking(false)
    }
  }

  const refreshStatus = () => {
    checkRecruiterAccess()
  }

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Non-recruiters can pass through
  if (accessStatus === 'not_recruiter') {
    return children
  }

  // Active recruiters can access
  if (accessStatus === 'active') {
    return children
  }

  // Handle pending approval state
  if (accessStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Approval Pending
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your recruiter access request is currently being reviewed by an admin. 
              Youll receive an email notification once approved.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Status: Waiting for Approval</span>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                An admin will review your request and activate your account. This usually takes 1-2 business days.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={refreshStatus}
                className="btn btn-primary w-full"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Check Status
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="btn btn-secondary w-full"
              >
                Back to Login
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help? Contact{' '}
                <a href="mailto:admin@atbench.com" className="text-blue-600 hover:text-blue-700">
                  admin@atbench.com
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Handle error state
  if (accessStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              We couldnt verify your recruiter access. Please try again or contact support.
            </p>

            <div className="space-y-3">
              <button
                onClick={refreshStatus}
                className="btn btn-primary w-full"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="btn btn-secondary w-full"
              >
                Back to Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Fallback
  return children
}

export default RecruiterAccessGuard