// app/(client)/auth/register/ContactDetailsForm.jsx (Simplified Phone - No Validation)
import { Phone, MapPin, Building, Briefcase, CheckCircle, Shield, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ContactDetailsForm({
  role,
  register,
  errors,
  isLoading,
  nextStep,
  prevStep,
  watch
}) {
  const [touchedFields, setTouchedFields] = useState({})
  
  const phone = watch('phone')
  const companyName = watch('companyName')
  const companySize = watch('companySize')
  const industry = watch('industry')

  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-secondary-900">
          {role === 'EMPLOYEE' ? 'Contact Information' : 
           role === 'EMPLOYER' ? 'Company Details' : 
           'Administrator Setup'}
        </h3>
        <p className="text-secondary-600 mt-2">
          {role === 'EMPLOYEE' ? 'Help us personalize your experience and connect you with opportunities' : 
           role === 'EMPLOYER' ? 'Tell us about your company to help us match you with the right talent' : 
           'Set up your administrator account with full recruiting access'}
        </p>
      </div>

      {/* Simplified Phone Number Field - No Validation */}
      <div className="form-group">
        <label htmlFor="phone" className="form-label required text-secondary-800">
          Phone Number
        </label>
        <div className="input-with-icon">
          <input
            id="phone"
            type="tel"
            {...register('phone', { 
              required: 'Phone number is required'
            })}
            onBlur={() => handleFieldBlur('phone')}
            className={`input-field transition-all duration-200 ${
              errors.phone && touchedFields.phone
                ? 'border-red-400 bg-red-50 focus:border-red-500' 
                : phone && touchedFields.phone
                ? 'border-green-400 bg-green-50 focus:border-green-500'
                : 'focus:border-primary-400 focus:bg-white'
            }`}
            placeholder="Enter your phone number"
            disabled={isLoading}
          />
          <Phone className={`input-icon ${
            errors.phone && touchedFields.phone
              ? 'text-red-400' 
              : phone && touchedFields.phone
              ? 'text-green-400'
              : 'text-secondary-400'
          }`} />
          {phone && touchedFields.phone && !errors.phone && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
        </div>
        
        {/* Show validation messages only after blur */}
        {touchedFields.phone && errors.phone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="form-error flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {errors.phone.message}
          </motion.div>
        )}
        
        {/* {touchedFields.phone && phone && !errors.phone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm mt-1 flex items-center gap-2 text-green-600"
          >
            <CheckCircle className="w-4 h-4" />
            Phone number looks good!
          </motion.div>
        )} */}
        
        {!touchedFields.phone && (
          <p className="text-xs text-gray-500 mt-1">
            Enter any valid phone number format
          </p>
        )}
      </div>

      {/* Employee - Location */}
      {role === 'EMPLOYEE' && (
        <div className="form-group">
          <label htmlFor="location" className="form-label text-secondary-800">
            Location (Optional)
          </label>
          <div className="input-with-icon">
            <input
              id="location"
              {...register('location')}
              onBlur={() => handleFieldBlur('location')}
              className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
              placeholder="City, State or Country"
              disabled={isLoading}
            />
            <MapPin className="input-icon text-secondary-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This helps us show you relevant job opportunities in your area
          </p>
        </div>
      )}

      {/* Employer - Enhanced Company Information */}
      {role === 'EMPLOYER' && (
        <div className="space-y-6">
          <div className="form-group">
            <label htmlFor="companyName" className="form-label required text-secondary-800">
              Company Name
            </label>
            <div className="input-with-icon">
              <input
                id="companyName"
                {...register('companyName', { 
                  required: 'Company name is required',
                  minLength: { value: 2, message: 'Company name must be at least 2 characters' }
                })}
                onBlur={() => handleFieldBlur('companyName')}
                className={`input-field transition-all duration-200 ${
                  errors.companyName && touchedFields.companyName
                    ? 'border-red-400 bg-red-50' 
                    : companyName && companyName.length >= 2 && touchedFields.companyName
                    ? 'border-green-400 bg-green-50'
                    : 'focus:border-primary-400 focus:bg-white'
                }`}
                placeholder="Enter your company name"
                disabled={isLoading}
              />
              <Building className={`input-icon ${
                errors.companyName && touchedFields.companyName
                  ? 'text-red-400' 
                  : companyName && companyName.length >= 2 && touchedFields.companyName
                  ? 'text-green-400'
                  : 'text-secondary-400'
              }`} />
              {companyName && companyName.length >= 2 && !errors.companyName && touchedFields.companyName && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {touchedFields.companyName && errors.companyName && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="form-error flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.companyName.message}
              </motion.div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="companySize" className="form-label required text-secondary-800">
                Company Size
              </label>
              <select
                id="companySize"
                {...register('companySize', { required: 'Company size is required' })}
                onBlur={() => handleFieldBlur('companySize')}
                className={`input-field transition-all duration-200 ${
                  errors.companySize && touchedFields.companySize
                    ? 'border-red-400 bg-red-50' 
                    : companySize && touchedFields.companySize
                    ? 'border-green-400 bg-green-50'
                    : 'focus:border-primary-400 focus:bg-white'
                }`}
                disabled={isLoading}
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees (Startup)</option>
                <option value="11-50">11-50 employees (Small)</option>
                <option value="51-200">51-200 employees (Medium)</option>
                <option value="201-500">201-500 employees (Large)</option>
                <option value="500+">500+ employees (Enterprise)</option>
              </select>
              {touchedFields.companySize && errors.companySize && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.companySize.message}
                </motion.div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="industry" className="form-label required text-secondary-800">
                Industry
              </label>
              <select
                id="industry"
                {...register('industry', { required: 'Industry is required' })}
                onBlur={() => handleFieldBlur('industry')}
                className={`input-field transition-all duration-200 ${
                  errors.industry && touchedFields.industry
                    ? 'border-red-400 bg-red-50' 
                    : industry && touchedFields.industry
                    ? 'border-green-400 bg-green-50'
                    : 'focus:border-primary-400 focus:bg-white'
                }`}
                disabled={isLoading}
              >
                <option value="">Select your industry</option>
                <option value="technology">Technology & Software</option>
                <option value="healthcare">Healthcare & Medical</option>
                <option value="finance">Finance & Banking</option>
                <option value="education">Education & Training</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="consulting">Consulting & Professional Services</option>
                <option value="marketing">Marketing & Advertising</option>
                <option value="real-estate">Real Estate</option>
                <option value="automotive">Automotive</option>
                <option value="other">Other</option>
              </select>
              {touchedFields.industry && errors.industry && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.industry.message}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter - Administrator Access (All new recruiters are admins) */}
      {role === 'RECRUITER' && (
        <div className="space-y-6">
          {/* Department */}
          <div className="form-group">
            <label htmlFor="department" className="form-label text-secondary-800">
              Department (Optional)
            </label>
            <div className="input-with-icon">
              <input
                id="department"
                {...register('department')}
                onBlur={() => handleFieldBlur('department')}
                className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                placeholder="e.g., Engineering, Sales, Marketing"
                disabled={isLoading}
              />
              <Briefcase className="input-icon text-secondary-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This helps organize your team and assign relevant candidates
            </p>
          </div>

          {/* Administrator Info */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Administrator Account</h4>
                <p className="text-sm text-gray-600">You'll have full access to all recruiting features</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Team Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Full Database Access</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Analytics & Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Add Team Members</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> After registration, you can add team members with specific roles like Technical Analyst, HR, Customer Success, Lead Recruiter, or Junior Recruiter.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <motion.button
          type="button"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-secondary flex-1 py-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextStep}
          disabled={isLoading || !phone}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>
      </div>
    </div>
  )
}