// app/(client)/components/ChangePassword.jsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Key,
  X
} from 'lucide-react'

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

export default function ChangePassword({ user, isModal = false, onClose = null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordChanged, setIsPasswordChanged] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  
  const newPassword = watch('newPassword')
  const confirmPassword = watch('confirmPassword')
  const passwordStrength = getPasswordStrength(newPassword)

  // Check if user uses social login
  const isSocialLogin = user && !user.password && (user.image || user.email)

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: data.currentPassword,
          newPassword: data.newPassword 
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsPasswordChanged(true)
        reset()
        toast.success('Password changed successfully!')
        
        // Close modal after 2 seconds if it's a modal
        if (isModal && onClose) {
          setTimeout(() => {
            onClose()
            setIsPasswordChanged(false)
          }, 2000)
        }
      } else {
        if (result.socialLogin) {
          toast.error('This account uses social login. Password change is not available.')
        } else {
          toast.error(result.message || 'Failed to change password')
        }
      }
    } catch (error) {
      console.error('Change password error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    if (isModal && onClose) {
      onClose()
    }
  }

  // Social login users cannot change password
  if (isSocialLogin) {
    return (
      <div className={`${isModal ? 'p-6' : 'card'}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Social Login Account
          </h3>
          <p className="text-gray-600 mb-4">
            You&ap;re signed in with a social account. Password changes are not available for social login accounts.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              To add password login, you would need to create a new account with email and password.
            </p>
          </div>
          {isModal && (
            <button onClick={onClose} className="btn btn-secondary mt-4">
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  // Success state
  if (isPasswordChanged && !isModal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Password Changed Successfully!
          </h3>
          <p className="text-gray-600 mb-4">
            Your password has been updated. Your account is now more secure.
          </p>
          <button
            onClick={() => setIsPasswordChanged(false)}
            className="btn btn-primary"
          >
            Change Password Again
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`${isModal ? 'p-6' : 'card'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-600">Update your account password</p>
          </div>
        </div>
        {isModal && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isPasswordChanged && isModal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Password changed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <div className="form-group">
          <label htmlFor="currentPassword" className="form-label required text-gray-800">
            Current Password
          </label>
          <div className="input-with-icon">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword', {
                required: 'Current password is required'
              })}
              className={`input-field pr-12 transition-all duration-200 ${
                errors.currentPassword ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'
              }`}
              placeholder="Enter your current password"
              disabled={isLoading}
            />
            <Lock className="input-icon text-gray-400" />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-error flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.currentPassword.message}
            </motion.div>
          )}
        </div>

        {/* New Password */}
        <div className="form-group">
          <label htmlFor="newPassword" className="form-label required text-gray-800">
            New Password
          </label>
          <div className="input-with-icon">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className={`input-field pr-12 transition-all duration-200 ${
                errors.newPassword ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'
              }`}
              placeholder="Create a new secure password"
              disabled={isLoading}
            />
            <Lock className="input-icon text-gray-400" />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
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

          {errors.newPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-error flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.newPassword.message}
            </motion.div>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label required text-gray-800">
            Confirm New Password
          </label>
          <div className="input-with-icon">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              className={`input-field pr-12 transition-all duration-200 ${
                errors.confirmPassword 
                  ? 'border-red-400 bg-red-50' 
                  : confirmPassword && confirmPassword === newPassword
                  ? 'border-green-400 bg-green-50'
                  : 'focus:border-primary-400 focus:bg-white'
              }`}
              placeholder="Confirm your new password"
              disabled={isLoading}
            />
            <Lock className={`input-icon ${
              errors.confirmPassword 
                ? 'text-red-400' 
                : confirmPassword && confirmPassword === newPassword
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

          {confirmPassword && confirmPassword === newPassword && !errors.confirmPassword && (
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

        {/* Security tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Password Security Tips:</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use at least 6 characters</li>
            <li>• Include letters, numbers, and symbols</li>
            <li>• Don't reuse passwords from other accounts</li>
            <li>• Avoid common words or personal information</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="btn btn-primary flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}