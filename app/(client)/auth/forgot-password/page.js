// app/(client)/auth/forgot-password/page.js
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Mail, 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  
  const email = watch('email')

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.toLowerCase() })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmittedEmail(data.email)
        setEmailSent(true)
        toast.success('Reset instructions sent!')
      } else {
        toast.error(result.message || 'Something went wrong')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className=" bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h1>
              
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to:
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-800">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">{submittedEmail}</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 text-yellow-800 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1">
                      <li>• Check your spam/junk folder if you don't see the email</li>
                      <li>• The reset link expires in 1 hour</li>
                      <li>• Click the link in the email to reset your password</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setSubmittedEmail('')
                  }}
                  className="btn btn-secondary w-full"
                >
                  Try Different Email
                </button>
                
                <Link href="/auth/login" className="btn btn-primary w-full">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary-400 to-purple-600 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full opacity-5 blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          {/* <div className="flex justify-center mb-6">
            <Image src="/atlogo.svg" alt="At Bench Logo" width={200} height={80} />
          </div> */}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label required text-gray-800">
                Email Address
              </label>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className={`input-field transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-400 bg-red-50' 
                      : email && /^\S+@\S+$/i.test(email)
                      ? 'border-green-400 bg-green-50'
                      : 'focus:border-primary-400 focus:bg-white'
                  }`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                <Mail className={`input-icon ${
                  errors.email 
                    ? 'text-red-400' 
                    : email && /^\S+@\S+$/i.test(email)
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`} />
                
                {email && /^\S+@\S+$/i.test(email) && !errors.email && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              
              {errors.email && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </motion.div>
              )}
              
              {!errors.email && (
                <p className="text-xs text-gray-500 mt-1">
                  We'll send reset instructions to this email address
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !email || !!errors.email}
              className="btn btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Instructions...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Reset Instructions
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}