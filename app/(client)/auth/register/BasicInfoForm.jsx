import { User, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

// Enhanced email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export default function BasicInfoForm({ register, errors, isLoading, nextStep, watch }) {
  const [touchedFields, setTouchedFields] = useState({})
  
  const email = watch('email')
  const name = watch('name')

  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h3>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>

      <div className="form-group">
        <label htmlFor="name" className="form-label required text-secondary-800">
          Full Name
        </label>
        <div className="input-with-icon">
          <input
            id="name"
            {...register('name', {
              required: 'Full name is required',
              minLength: { 
                value: 2, 
                message: 'Name must be at least 2 characters' 
              },
              maxLength: {
                value: 50,
                message: 'Name must be less than 50 characters'
              },
              pattern: {
                value: /^[a-zA-Z\s'-]+$/,
                message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
              }
            })}
            onBlur={() => handleFieldBlur('name')}
            className={`input-field transition-all duration-200 ${
              errors.name && touchedFields.name
                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                : name && name.length >= 2 && touchedFields.name
                ? 'border-green-400 bg-green-50 focus:border-green-500'
                : 'focus:border-primary-400 focus:bg-white'
            }`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          <User className={`input-icon ${
            errors.name && touchedFields.name
              ? 'text-red-400' 
              : name && name.length >= 2 && touchedFields.name
              ? 'text-green-400'
              : 'text-secondary-400'
          }`} />
          {name && name.length >= 2 && !errors.name && touchedFields.name && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
        </div>
        {touchedFields.name && errors.name && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="form-error flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {errors.name.message}
          </motion.div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label required text-secondary-800">
          Email Address
        </label>
        <div className="input-with-icon">
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: EMAIL_REGEX,
                message: 'Please enter a valid email address (e.g., user@example.com)'
              }
            })}
            onBlur={() => handleFieldBlur('email')}
            className={`input-field transition-all duration-200 ${
              errors.email && touchedFields.email
                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                : email && EMAIL_REGEX.test(email) && touchedFields.email
                ? 'border-green-400 bg-green-50 focus:border-green-500'
                : 'focus:border-primary-400 focus:bg-white'
            }`}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
          <Mail className={`input-icon ${
            errors.email && touchedFields.email
              ? 'text-red-400' 
              : email && EMAIL_REGEX.test(email) && touchedFields.email
              ? 'text-green-400'
              : 'text-secondary-400'
          }`} />
          {email && EMAIL_REGEX.test(email) && touchedFields.email && !errors.email && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
        </div>
        
        {touchedFields.email && errors.email && (
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

        {touchedFields.email && email && EMAIL_REGEX.test(email) && !errors.email && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm mt-1 flex items-center gap-2 text-green-600"
          >
            <CheckCircle className="w-4 h-4" />
            Email address looks good!
          </motion.div>
        )}
        
        {!touchedFields.email && (
          <p className="text-xs text-gray-500 mt-1">
            We'll use this email to send you important updates about your account
          </p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={nextStep}
        disabled={isLoading || !name || !email || !!errors.name || !!errors.email}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </motion.button>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Make sure your email is correct - we'll send verification and important updates there
        </p>
      </div>
    </div>
  )
}