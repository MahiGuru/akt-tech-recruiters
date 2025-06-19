// app/(client)/auth/reset-password/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'

function getPasswordStrength(password) {
  if (!password) return { strength: 0, label: '', color: '' }
  let strength = 0
  if (password.length >= 6) strength++
  if (password.match(/[a-z]/)) strength++
  if (password.match(/[A-Z]/)) strength++
  if (password.match(/[0-9]/)) strength++
  if (password.match(/[^a-zA-Z0-9]/)) strength++
  
  const levels = [
    { strength: 0, label: '', color: '' },
    { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
    { strength: 2, label: 'Weak', color: 'bg-orange-500' },
    { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
    { strength: 4, label: 'Good', color: 'bg-blue-500' },
    { strength: 5, label: 'Strong', color: 'bg-green-500' }
  ]
  return levels[strength]
}

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValidating, setTokenValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordResetComplete, setPasswordResetComplete] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const passwordStrength = getPasswordStrength(password)

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Invalid reset link')
        router.push('/auth/forgot-password')
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const result = await response.json()

        if (response.ok && result.valid) {
          setTokenValid(true)
          setUserEmail(result.email)
        } else {
          toast.error(result.message || 'Invalid or expired reset link')
          router.push('/auth/forgot-password')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        toast.error('Unable to validate reset link')
        router.push('/auth/forgot-password')
      } finally {
        setTokenValidating(false)
      }
    }

    validateToken()
  }, [token, router])

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password: data.password 
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setPasswordResetComplete(true)
        toast.success('Password reset successfully!')
      } else {
        toast.error(result.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (tokenValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Reset Link</h2>
          <p className="text-gray-600">Please wait while we verify your reset token...</p>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (passwordResetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
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
                Password Reset Successfully!
              </h1>
              
              <p className="text-gray-600 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Your account is now secure with the new password</span>
                </div>
              </div>
              
              <Link href="/auth/login" className="btn btn-primary w-full">
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Token invalid - this shouldn't render due to useEffect redirect
  if (!tokenValid) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
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
          <div className="flex justify-center mb-6">
            <Image src="/atlogo.svg" alt="At Bench Logo" width={200} height={80} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set New Password
          </h1>
          <p className="text-gray-600 mb-2">
            Create a new password for your account
          </p>
          {userEmail && (
            <p className="text-sm text-blue-600 font-medium">{userEmail}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label required text-gray-800">
                New Password
              </label>
              <div className="input-with-icon">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={`input-field pr-12 transition-all duration-200 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'
                  }`}
                  placeholder="Create a secure password"
                  disabled={isLoading}
                />
                <Lock className="input-icon text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}

              {errors.password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label required text-gray-800">
                Confirm New Password
              </label>
              <div className="input-with-icon">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className={`input-field pr-12 transition-all duration-200 ${
                    errors.confirmPassword 
                      ? 'border-red-400 bg-red-50' 
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-400 bg-green-50'
                      : 'focus:border-primary-400 focus:bg-white'
                  }`}
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                />
                <Lock className={`input-icon ${
                  errors.confirmPassword 
                    ? 'text-red-400' 
                    : confirmPassword && confirmPassword === password
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm mt-1 flex items-center gap-2 text-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Passwords match!
                </motion.div>
              )}

              {errors.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword.message}
                </motion.div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || !!errors.password}
              className="btn btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Security note */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Your password is encrypted and secure. We recommend using a strong password with a mix of letters, numbers, and symbols.
          </p>
        </div>
      </motion.div>
    </div>
  )
}