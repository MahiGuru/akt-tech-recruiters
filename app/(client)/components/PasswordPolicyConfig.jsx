// app/(client)/components/PasswordPolicyConfig.jsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Shield, 
  Lock, 
  Clock, 
  AlertTriangle,
  Check,
  X,
  Save,
  RefreshCw,
  Info
} from 'lucide-react'

export default function PasswordPolicyConfig() {
  const [policy, setPolicy] = useState({
    minLength: 6,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    maxAge: null,
    preventReuse: false,
    lockoutAttempts: 5,
    lockoutDuration: 15
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchPolicy()
  }, [])

  const fetchPolicy = async () => {
    try {
      const response = await fetch('/api/admin/password-policy')
      if (response.ok) {
        const data = await response.json()
        setPolicy({
          ...data.policy,
          lockoutDuration: Math.floor(data.policy.lockoutDuration / (60 * 1000)) // Convert to minutes
        })
        setUnsavedChanges(false)
      }
    } catch (error) {
      console.error('Error fetching password policy:', error)
      toast.error('Failed to load password policy')
    } finally {
      setLoading(false)
    }
  }

  const updatePolicy = (key, value) => {
    setPolicy(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
  }

  const savePolicy = async () => {
    setSaving(true)
    try {
      const policyToSave = {
        ...policy,
        lockoutDuration: policy.lockoutDuration * 60 * 1000 // Convert to milliseconds
      }

      const response = await fetch('/api/admin/password-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policyToSave })
      })

      if (response.ok) {
        toast.success('Password policy updated successfully')
        setUnsavedChanges(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update password policy')
      }
    } catch (error) {
      console.error('Error saving password policy:', error)
      toast.error('Failed to save password policy')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPolicy({
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      maxAge: null,
      preventReuse: false,
      lockoutAttempts: 5,
      lockoutDuration: 15
    })
    setUnsavedChanges(true)
  }

  // Calculate password strength requirements
  const getStrengthLevel = () => {
    let level = 'Basic'
    let count = 0
    
    if (policy.minLength >= 8) count++
    if (policy.requireUppercase) count++
    if (policy.requireLowercase) count++
    if (policy.requireNumbers) count++
    if (policy.requireSpecialChars) count++
    
    if (count >= 4) level = 'Strong'
    else if (count >= 2) level = 'Medium'
    
    return { level, count }
  }

  const strength = getStrengthLevel()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Password Policy</h2>
          <p className="text-gray-600 mt-1">Configure password requirements and security settings</p>
        </div>
        <div className="flex gap-3">
          {unsavedChanges && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <button
            onClick={fetchPolicy}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={savePolicy}
            className="btn btn-primary"
            disabled={saving || !unsavedChanges}
          >
            {saving ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Policy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Strength Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Policy Strength</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            strength.level === 'Strong' ? 'bg-green-100 text-green-800' :
            strength.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {strength.level}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Requirements Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Minimum {policy.minLength} characters</span>
              </div>
              {policy.requireUppercase && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Uppercase letters required</span>
                </div>
              )}
              {policy.requireLowercase && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Lowercase letters required</span>
                </div>
              )}
              {policy.requireNumbers && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Numbers required</span>
                </div>
              )}
              {policy.requireSpecialChars && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Special characters required</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Security Settings</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Account lockout: {policy.lockoutAttempts} failed attempts</p>
              <p>Lockout duration: {policy.lockoutDuration} minutes</p>
              {policy.maxAge && <p>Password expires: {policy.maxAge} days</p>}
              <p>Password reuse: {policy.preventReuse ? 'Prevented' : 'Allowed'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Password Requirements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Minimum Length */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Minimum Length
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="50"
                value={policy.minLength}
                onChange={(e) => updatePolicy('minLength', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 w-12">
                {policy.minLength}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Recommended: 8+ characters for better security
            </p>
          </div>

          {/* Character Requirements */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Character Requirements
            </label>
            
            {[
              { key: 'requireUppercase', label: 'Uppercase letters (A-Z)' },
              { key: 'requireLowercase', label: 'Lowercase letters (a-z)' },
              { key: 'requireNumbers', label: 'Numbers (0-9)' },
              { key: 'requireSpecialChars', label: 'Special characters (!@#$...)' }
            ].map((requirement) => (
              <label key={requirement.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy[requirement.key]}
                  onChange={(e) => updatePolicy(requirement.key, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{requirement.label}</span>
              </label>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Lockout */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failed Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={policy.lockoutAttempts}
                onChange={(e) => updatePolicy('lockoutAttempts', parseInt(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lock account after this many failed attempts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={policy.lockoutDuration}
                onChange={(e) => updatePolicy('lockoutDuration', parseInt(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to lock the account
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiration (days)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                placeholder="Never expires"
                value={policy.maxAge || ''}
                onChange={(e) => updatePolicy('maxAge', e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no expiration
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.preventReuse}
                onChange={(e) => updatePolicy('preventReuse', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm text-gray-700">Prevent password reuse</span>
                <p className="text-xs text-gray-500">Don't allow using previous passwords</p>
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <button
          onClick={resetToDefaults}
          className="btn btn-outline"
        >
          Reset to Defaults
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Policy Application</p>
              <p>Changes apply to new passwords only. Existing users won't need to update their passwords unless they reset them.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}